const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");
const socket = require("./utils/socket");

dotenv.config();

// Connect to the database
connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socket.init(server);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a room (user ID or specialist ID)
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  // Handle call initiation
  socket.on('callInitiated', (callData) => {
    const { callId, channelName, callerId, receiverId } = callData;
    io.to(receiverId).emit('incomingCall', { callId, channelName, callerId });
  });

  // Handle call acceptance
  socket.on('callAccepted', (callData) => {
    const { callId, receiverId } = callData;
    io.to(receiverId).emit('callAccepted', { callId });
  });

  // Handle call rejection
  socket.on('callRejected', (callData) => {
    const { callId, receiverId } = callData;
    io.to(receiverId).emit('callRejected', { callId });
  });

  // Handle call ending
  socket.on('callEnded', (callData) => {
    const { callId, receiverId } = callData;
    io.to(receiverId).emit('callEnded', { callId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
