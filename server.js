const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store waiting users and active rooms
const waitingUsers = new Set();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle finding a match
  socket.on('find-match', () => {
    console.log('User looking for match:', socket.id);
    
    if (waitingUsers.size > 0) {
      // Match with a waiting user
      const waitingUserId = Array.from(waitingUsers)[0];
      waitingUsers.delete(waitingUserId);
      
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      rooms.set(roomId, [socket.id, waitingUserId]);
      
      // Join both users to the room
      socket.join(roomId);
      io.sockets.sockets.get(waitingUserId)?.join(roomId);
      
      // Notify both users
      socket.emit('match-found', { roomId, isInitiator: true });
      io.sockets.sockets.get(waitingUserId)?.emit('match-found', { roomId, isInitiator: false });
      
      console.log(`Matched users ${socket.id} and ${waitingUserId} in room ${roomId}`);
    } else {
      // Add to waiting list
      waitingUsers.add(socket.id);
      console.log('User added to waiting list:', socket.id);
    }
  });

  // Handle joining a specific room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle WebRTC signaling
  socket.on('offer', (offer) => {
    socket.to(Array.from(socket.rooms)[1]).emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.to(Array.from(socket.rooms)[1]).emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    socket.to(Array.from(socket.rooms)[1]).emit('ice-candidate', candidate);
  });

  // Handle chat messages
  socket.on('chat-message', (message) => {
    socket.to(Array.from(socket.rooms)[1]).emit('chat-message', {
      id: Date.now().toString(),
      text: message,
      isOwn: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from waiting list if present
    waitingUsers.delete(socket.id);
    
    // Clean up rooms
    for (const [roomId, users] of rooms.entries()) {
      if (users.includes(socket.id)) {
        const otherUser = users.find(id => id !== socket.id);
        if (otherUser) {
          io.sockets.sockets.get(otherUser)?.emit('user-disconnected');
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
