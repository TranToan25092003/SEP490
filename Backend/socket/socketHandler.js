const { Server } = require("socket.io");
const { handleConnection } = require("./eventHandlers");

let io = null;

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Socket.IO connection handling
  io.on("connection", handleConnection);

  console.log("Socket.IO server initialized");
  return io;
};

// Get Socket.IO instance
const getSocketIO = () => {
  return io;
};

module.exports = {
  initializeSocket,
  getSocketIO,
};
