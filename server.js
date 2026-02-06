import http from "http";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

/* ================= QUEUE ================= */

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(id) {
    if (!this.items.includes(id)) {
      this.items.push(id);
    }
  }

  dequeue() {
    return this.items.shift();
  }

  remove(id) {
    this.items = this.items.filter((item) => item !== id);
  }

  has(id) {
    return this.items.includes(id);
  }

  size() {
    return this.items.length;
  }

  print() {
    console.log("QUEUE:", this.items);
  }
}

/* ================= ROOM MANAGER ================= */

class RoomManager {
  constructor(io) {
    this.io = io;
    this.queue = new Queue();
    this.rooms = new Map(); // roomId -> { user1, user2 }
    this.userRoom = new Map(); // socketId -> roomId
  }

  addUser(socket) {
    const socketId = socket.id;

    if (this.queue.has(socketId) || this.userRoom.has(socketId)) return;

    this.queue.enqueue(socketId);
    console.log("User queued:", socketId);
    this.queue.print();

    // SAFER: handle multiple joins
    while (this.queue.size() >= 2) {
      const user1 = this.queue.dequeue();
      const user2 = this.queue.dequeue();

      if (!user1 || !user2) return;

      const roomId = uuidv4();

      this.rooms.set(roomId, { user1, user2 });
      this.userRoom.set(user1, roomId);
      this.userRoom.set(user2, roomId);

      this.io.sockets.sockets.get(user1)?.join(roomId);
      this.io.sockets.sockets.get(user2)?.join(roomId);

      this.io.to(roomId).emit("joined", { roomId });

      // Random offerer
      const offerer = Math.random() > 0.5 ? user1 : user2;
      this.io.to(offerer).emit("send-offer");

      console.log("Room created:", roomId);
    }
  }

  validate(socketId, roomId) {
    return this.userRoom.get(socketId) === roomId;
  }

  getReceiver(socketId, room) {
    return room.user1 === socketId ? room.user2 : room.user1;
  }

  handleOffer(socketId, roomId, offer) {
    if (!this.validate(socketId, roomId)) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const receiver = this.getReceiver(socketId, room);
    this.io.to(receiver).emit("offer", { offer });
  }

  handleAnswer(socketId, roomId, answer) {
    if (!this.validate(socketId, roomId)) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const receiver = this.getReceiver(socketId, room);
    this.io.to(receiver).emit("answer", { answer });
  }

  handleIceCandidates(socketId, roomId, candidate) {
    if (!this.validate(socketId, roomId)) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const receiver = this.getReceiver(socketId, room);
    this.io.to(receiver).emit("ice-candidates", { candidate });
  }

  handleMessage(socketId, roomId, message) {
    if (!this.validate(socketId, roomId)) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const receiver = this.getReceiver(socketId, room);
    this.io.to(receiver).emit("message", { message });
  }

  leaveRoom(socketId, requeue = true) {
    const roomId = this.userRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const otherUser = this.getReceiver(socketId, room);

    this.io.to(otherUser).emit("leaveRoom");

    this.io.sockets.sockets.get(socketId)?.leave(roomId);
    this.io.sockets.sockets.get(otherUser)?.leave(roomId);

    this.rooms.delete(roomId);
    this.userRoom.delete(socketId);
    this.userRoom.delete(otherUser);

    if (requeue) {
      this.queue.enqueue(otherUser);
    }

    console.log("Room deleted:", roomId);
  }

  disconnect(socketId) {
    console.log("Disconnected:", socketId);
    this.queue.remove(socketId);
    this.leaveRoom(socketId, false);
  }
}

/* ================= SERVER SETUP ================= */

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "https://strangerlive.vercel.app",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.get("/", (_, res) => {
  res.json({ status: "Server running" });
});

const manager = new RoomManager(io);
let USER_COUNT = 0;

/* ================= SOCKET EVENTS ================= */

io.on("connection", (socket) => {
  USER_COUNT++;
  io.emit("user-count", USER_COUNT);
  console.log("Connected:", socket.id);

  socket.on("join", () => {
    manager.addUser(socket);
  });

  socket.on("offer", ({ roomId, offer }) => {
    manager.handleOffer(socket.id, roomId, offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    manager.handleAnswer(socket.id, roomId, answer);
  });

  socket.on("ice-candidates", ({ roomId, candidate }) => {
    manager.handleIceCandidates(socket.id, roomId, candidate);
  });

  socket.on("message", ({ roomId, message }) => {
    manager.handleMessage(socket.id, roomId, message);
  });

  socket.on("leaveRoom", () => {
    manager.leaveRoom(socket.id);
  });

  socket.on("disconnect", () => {
    USER_COUNT = Math.max(0, USER_COUNT - 1);
    io.emit("user-count", USER_COUNT);
    manager.disconnect(socket.id);
  });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0" || 3001, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
