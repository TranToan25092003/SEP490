// Socket.IO module exports
const { initializeSocket, getSocketIO } = require("./socketHandler");
const { handleConnection } = require("./eventHandlers");
const {
  emitToRoom,
  emitToAll,
  getClientsInRoom,
  getAllRooms,
  roomExists,
  getSocketById,
  disconnectSocket,
  broadcastToOthers,
} = require("./socketUtils");

module.exports = {
  // Socket handler
  initializeSocket,
  getSocketIO,

  // Event handlers
  handleConnection,

  // Utility functions
  emitToRoom,
  emitToAll,
  getClientsInRoom,
  getAllRooms,
  roomExists,
  getSocketById,
  disconnectSocket,
  broadcastToOthers,
};
