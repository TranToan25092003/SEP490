const { Server } = require("socket.io");
const { handleConnection, setIOInstance } = require("./eventHandlers");

let io = null;

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Set io instance in eventHandlers for broadcasting
  setIOInstance(io);

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
