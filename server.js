const { Server } = require("socket.io");
const http = require("http");
const https = require("https");
const fs = require("fs");
const geoip = require("geoip-lite"); // optional: npm install geoip-lite

// ✅ Setup HTTPS if available (for local dev or prod)
let server;
try {
  const useHttps = process.env.HTTPS === "true";
  const keyPath = process.env.SSL_KEY || "./dev-key.pem";
  const certPath = process.env.SSL_CERT || "./dev-cert.pem";
  const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);

  if (useHttps && hasCerts) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    server = https.createServer(options);
    console.log("✅ Using HTTPS for Socket.IO server", { keyPath, certPath });
  } else {
    server = http.createServer();
    console.log("⚙️ Using HTTP server (no SSL detected)");
  }
} catch (e) {
  console.warn("⚠️ Falling back to HTTP server due to HTTPS setup error:", e);
  server = http.createServer();
}

// ✅ Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowlist = [
        /^http:\/\/localhost:3000$/,
        /^https:\/\/localhost:3000$/,
        /^http:\/\/127\.0\.0\.1:3000$/,
        /^https:\/\/127\.0\.0\.1:3000$/,
      ];
      const isLan =
        typeof origin === "string" &&
        /^(http|https):\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
      const allowed =
        !origin || allowlist.some((re) => re.test(origin)) || isLan;
      if (allowed) return callback(null, true);
      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
});

// ✅ User tracking structures
const waitingUsers = new Set();
const rooms = new Map();
const onlineUsers = new Set();
const userInterests = new Map();
const userIPs = new Map(); // store IPs for connected users

// ✅ Handle socket connections
io.on("connection", (socket) => {
  // --- Detect client IP ---
  const clientIp =
    socket.handshake.query.ip ||
    socket.handshake.headers["x-forwarded-for"]?.split(",")[0] ||
    socket.handshake.address;

  userIPs.set(socket.id, clientIp);
  onlineUsers.add(socket.id);

  const geo = geoip.lookup(clientIp);
  const location = geo
    ? `${geo.country || "Unknown"} (${geo.city || "N/A"})`
    : "Unknown";

  console.log(
    `🌐 User connected: ${socket.id} | IP: ${clientIp} | Location: ${location}`
  );

  // Send current online count to the new user
  socket.emit("online-count", onlineUsers.size);

  // Broadcast updated online count to all users
  io.emit("online-count", onlineUsers.size);

  // --- Handle match finding ---
  socket.on("find-match", (data) => {
    console.log("User looking for match:", socket.id, data);

    if (data && data.interests) {
      userInterests.set(socket.id, data.interests);
    }

    if (waitingUsers.size > 0) {
      let bestMatch = null;
      const currentInterests = userInterests.get(socket.id) || "";

      if (currentInterests) {
        for (const waitingUserId of waitingUsers) {
          const waitingInterests = userInterests.get(waitingUserId) || "";
          if (
            waitingInterests &&
            currentInterests
              .toLowerCase()
              .includes(waitingInterests.toLowerCase())
          ) {
            bestMatch = waitingUserId;
            break;
          }
        }
      }

      if (!bestMatch) {
        bestMatch = Array.from(waitingUsers)[0];
      }

      waitingUsers.delete(bestMatch);

      const roomId = `room_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      rooms.set(roomId, [socket.id, bestMatch]);

      socket.join(roomId);
      io.sockets.sockets.get(bestMatch)?.join(roomId);

      socket.emit("match-found", { roomId, isInitiator: true });
      io.sockets.sockets
        .get(bestMatch)
        ?.emit("match-found", { roomId, isInitiator: false });

      console.log(
        `✅ Matched users ${socket.id} (${userIPs.get(
          socket.id
        )}) and ${bestMatch} (${userIPs.get(bestMatch)}) in room ${roomId}`
      );
    } else {
      waitingUsers.add(socket.id);
      console.log("🕓 User added to waiting list:", socket.id);
    }
  });

  // --- Handle WebRTC signaling ---
  socket.on("offer", (offer) => {
    const roomId = Array.from(socket.rooms)[1];
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    const roomId = Array.from(socket.rooms)[1];
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate) => {
    const roomId = Array.from(socket.rooms)[1];
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // --- Chat ---
  socket.on("chat-message", (message) => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId) {
      socket.to(roomId).emit("chat-message", {
        id: Date.now().toString(),
        text: message,
        isOwn: false,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // --- Typing indicators ---
  socket.on("typing-start", () => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId)
      socket
        .to(roomId)
        .emit("user-typing", { userId: socket.id, isTyping: true });
  });

  socket.on("typing-stop", () => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId)
      socket
        .to(roomId)
        .emit("user-typing", { userId: socket.id, isTyping: false });
  });

  // --- Admin stats ---
  socket.on("admin-request-stats", () => {
    socket.emit("admin-stats", {
      onlineUsers: onlineUsers.size,
      waitingUsers: waitingUsers.size,
      activeRooms: rooms.size,
    });
  });

  // --- Handle disconnect ---
  socket.on("disconnect", () => {
    console.log(
      `❌ User disconnected: ${socket.id} | IP: ${
        userIPs.get(socket.id) || "N/A"
      }`
    );

    onlineUsers.delete(socket.id);
    io.emit("online-count", onlineUsers.size);
    waitingUsers.delete(socket.id);
    userInterests.delete(socket.id);
    userIPs.delete(socket.id);

    for (const [roomId, users] of rooms.entries()) {
      if (users.includes(socket.id)) {
        const otherUser = users.find((id) => id !== socket.id);
        if (otherUser) {
          io.sockets.sockets.get(otherUser)?.emit("user-disconnected");
        }
        rooms.delete(roomId);
        break;
      }
    }
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});
