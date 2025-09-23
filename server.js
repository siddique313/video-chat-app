const { Server } = require("socket.io");
const http = require("http");
const https = require("https");
const fs = require("fs");

// Support HTTPS for local dev if certs are available and HTTPS env flag is set
let server;
try {
  const useHttps = process.env.HTTPS === "true";
  const keyPath = "./localhost-key.pem";
  const certPath = "./localhost.pem";
  const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);

  if (useHttps && hasCerts) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    server = https.createServer(options);
    console.log("Using HTTPS for Socket.IO server");
  } else {
    server = http.createServer();
  }
} catch (e) {
  console.warn("Falling back to HTTP server due to HTTPS setup error:", e);
  server = http.createServer();
}

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://127.0.0.1:3000",
      "https://127.0.0.1:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
});

// Store waiting users and active rooms
const waitingUsers = new Set();
const rooms = new Map();
const onlineUsers = new Set();
const userInterests = new Map(); // Store user interests for better matching

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  onlineUsers.add(socket.id);

  // Send current online count to the new user
  socket.emit("online-count", onlineUsers.size);

  // Broadcast updated online count to all users
  io.emit("online-count", onlineUsers.size);

  // Handle finding a match
  socket.on("find-match", (data) => {
    console.log("User looking for match:", socket.id, data);

    // Store user interests if provided
    if (data && data.interests) {
      userInterests.set(socket.id, data.interests);
    }

    if (waitingUsers.size > 0) {
      // Try to find a user with similar interests first
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

      // If no interest match found, use first waiting user
      if (!bestMatch) {
        bestMatch = Array.from(waitingUsers)[0];
      }

      waitingUsers.delete(bestMatch);

      const roomId = `room_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      rooms.set(roomId, [socket.id, bestMatch]);

      // Join both users to the room
      socket.join(roomId);
      io.sockets.sockets.get(bestMatch)?.join(roomId);

      // Notify both users
      socket.emit("match-found", { roomId, isInitiator: true });
      io.sockets.sockets
        .get(bestMatch)
        ?.emit("match-found", { roomId, isInitiator: false });

      console.log(
        `Matched users ${socket.id} and ${bestMatch} in room ${roomId}`
      );
    } else {
      // Add to waiting list
      waitingUsers.add(socket.id);
      console.log("User added to waiting list:", socket.id);
    }
  });

  // Handle joining a specific room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle WebRTC signaling
  socket.on("offer", (offer) => {
    socket.to(Array.from(socket.rooms)[1]).emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    socket.to(Array.from(socket.rooms)[1]).emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate) => {
    socket.to(Array.from(socket.rooms)[1]).emit("ice-candidate", candidate);
  });

  // Handle chat messages
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

  // Handle typing indicators
  socket.on("typing-start", () => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId) {
      socket
        .to(roomId)
        .emit("user-typing", { userId: socket.id, isTyping: true });
    }
  });

  socket.on("typing-stop", () => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId) {
      socket
        .to(roomId)
        .emit("user-typing", { userId: socket.id, isTyping: false });
    }
  });

  // Handle admin requests
  socket.on("admin-request-stats", () => {
    socket.emit("admin-stats", {
      onlineUsers: onlineUsers.size,
      waitingUsers: waitingUsers.size,
      activeRooms: rooms.size,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove from online users
    onlineUsers.delete(socket.id);
    io.emit("online-count", onlineUsers.size);

    // Remove from waiting list if present
    waitingUsers.delete(socket.id);

    // Clean up user interests
    userInterests.delete(socket.id);

    // Clean up rooms
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
