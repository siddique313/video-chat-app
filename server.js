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

  size() {
    return this.items.length;
  }

  has(id) {
    return this.items.includes(id);
  }

  print() {
    console.log("QUEUE => ", this.items);
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
    console.log("User added to queue:", socketId);
    this.queue.print();

    if (this.queue.size() >= 2) {
      const user1 = this.queue.dequeue();
      const user2 = this.queue.dequeue();

      const roomId = uuidv4();

      this.rooms.set(roomId, { user1, user2 });
      this.userRoom.set(user1, roomId);
      this.userRoom.set(user2, roomId);

      this.io.sockets.sockets.get(user1)?.join(roomId);
      this.io.sockets.sockets.get(user2)?.join(roomId);

      this.io.to(roomId).emit("joined", { roomId });

      // Ask first user to create WebRTC offer
      this.io.to(user1).emit("send-offer");

      console.log("Room created:", roomId);
    }
  }

  handleOffer(socketId, roomId, offer) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receiver = room.user1 === socketId ? room.user2 : room.user1;
    this.io.to(receiver).emit("offer", { offer });
  }

  handleAnswer(socketId, roomId, answer) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receiver = room.user1 === socketId ? room.user2 : room.user1;
    this.io.to(receiver).emit("answer", { answer });
  }

  handleIceCandidates(socketId, roomId, candidate) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receiver = room.user1 === socketId ? room.user2 : room.user1;
    this.io.to(receiver).emit("ice-candidates", { candidate });
  }

  handleMessage(socketId, roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receiver = room.user1 === socketId ? room.user2 : room.user1;
    this.io.to(receiver).emit("message", { message });
  }

  leaveRoom(socketId) {
    const roomId = this.userRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const otherUser = room.user1 === socketId ? room.user2 : room.user1;

    this.io.to(otherUser).emit("leaveRoom");

    this.rooms.delete(roomId);
    this.userRoom.delete(socketId);
    this.userRoom.delete(otherUser);

    this.io.sockets.sockets.get(otherUser)?.leave(roomId);

    console.log("Room deleted:", roomId);
  }

  disconnect(socketId) {
    console.log("Disconnected:", socketId);

    this.queue.remove(socketId);
    this.leaveRoom(socketId);
  }
}

/* ================= SERVER SETUP ================= */

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.get("/", (_, res) => res.json({ status: "Server running" }));

const manager = new RoomManager(io);

let USER_COUNT = 0;

/* ================= SOCKET EVENTS ================= */

io.on("connection", (Socket) => {
  USER_COUNT++;
  io.emit("user-count", USER_COUNT);
  console.log("Connected:", Socket.id);

  Socket.on("join", () => {
    manager.addUser(Socket);
  });

  Socket.on("offer", ({ roomId, offer }) => {
    manager.handleOffer(Socket.id, roomId, offer);
  });

  Socket.on("answer", ({ roomId, answer }) => {
    manager.handleAnswer(Socket.id, roomId, answer);
  });

  Socket.on("ice-candidates", ({ roomId, candidate }) => {
    manager.handleIceCandidates(Socket.id, roomId, candidate);
  });

  Socket.on("message", ({ roomId, message }) => {
    manager.handleMessage(Socket.id, roomId, message);
  });

  Socket.on("leaveRoom", () => {
    manager.leaveRoom(Socket.id);
  });

  Socket.on("disconnect", () => {
    USER_COUNT = Math.max(0, USER_COUNT - 1);
    io.emit("user-count", USER_COUNT);
    manager.disconnect(Socket.id);
  });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port
     ${PORT}`);
});
