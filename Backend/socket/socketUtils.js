// Socket.IO utility functions
const { getSocketIO } = require("./socketHandler");

// Emit message to specific room
const emitToRoom = (room, event, data) => {
  const io = getSocketIO();
  if (io) {
    io.to(room).emit(event, data);
    console.log(`Emitted ${event} to room ${room}:`, data);
  } else {
    console.error("Socket.IO not initialized");
  }
};

// Emit message to all connected clients
const emitToAll = (event, data) => {
  const io = getSocketIO();
  if (io) {
    io.emit(event, data);
    console.log(`Emitted ${event} to all clients:`, data);
  } else {
    console.error("Socket.IO not initialized");
  }
};

// Get connected clients in a room
const getClientsInRoom = (room) => {
  const io = getSocketIO();
  if (io) {
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    console.log(`Room ${room} has ${roomSize} clients`);
    return roomSize;
  }
  return 0;
};

// Get all rooms
const getAllRooms = () => {
  const io = getSocketIO();
  if (io) {
    return Array.from(io.sockets.adapter.rooms.keys());
  }
  return [];
};

// Check if room exists
const roomExists = (room) => {
  const io = getSocketIO();
  if (io) {
    return io.sockets.adapter.rooms.has(room);
  }
  return false;
};

// Get socket by ID
const getSocketById = (socketId) => {
  const io = getSocketIO();
  if (io) {
    return io.sockets.sockets.get(socketId);
  }
  return null;
};

// Disconnect specific socket
const disconnectSocket = (socketId) => {
  const socket = getSocketById(socketId);
  if (socket) {
    socket.disconnect();
    console.log(`Socket ${socketId} disconnected`);
  }
};

// Broadcast to all clients except sender
const broadcastToOthers = (socketId, event, data) => {
  const io = getSocketIO();
  if (io) {
    io.except(socketId).emit(event, data);
    console.log(`Broadcasted ${event} to all except ${socketId}:`, data);
  }
};

module.exports = {
  emitToRoom,
  emitToAll,
  getClientsInRoom,
  getAllRooms,
  roomExists,
  getSocketById,
  disconnectSocket,
  broadcastToOthers,
};
