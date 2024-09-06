const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");
const socket = require("./utils/socket");
// const Call = require("./models/Call")
// const mongoose = require("mongoose")

dotenv.config();

// Connect to the database
connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socket.init(server);

/// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("callInitiated", (callData) => {
    const { callId, channelName, callerId, receiverId, token } = callData;
    io.to(receiverId).emit("incomingCall", {
      callId,
      channelName,
      callerId,
      token,
    });
  });

  socket.on("callAccepted", (callData) => {
    const { callId, callerId, channelName, receiverId, token } = callData;
    io.to(callerId).emit("callAccepted", {
      callId,
      channelName,
      token,
    });
    io.to(receiverId).emit("callAccepted", {
      callId,
      channelName,
      token,
    });
  });

  socket.on("callRejected", (callData) => {
    const { callId, receiverId } = callData;
    io.to(receiverId).emit("callRejected", { callId });
  });

  socket.on("callEnded", (callData) => {
    const { callId, receiverId } = callData;
    io.to(receiverId).emit("callEnded", { callId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
