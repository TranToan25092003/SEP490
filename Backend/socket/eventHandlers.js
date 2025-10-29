// Socket.IO event handlers
const handleConnection = (socket) => {
  console.log("User connected:", socket.id);

  // Handle joining a room (customer or staff)
  socket.on("joinRoom", (data) => {
    const { room, userId, userType } = data;
    socket.join(room);
    socket.userId = userId;
    socket.userType = userType;
    console.log(`User ${userId} (${userType}) joined room ${room}`);
  });

  // Handle sending messages
  socket.on("sendMessage", (data) => {
    const { customerId, message } = data;
    const room = `chat_${customerId}`;

    // Broadcast message to the room
    socket.to(room).emit("newMessage", message);
    console.log(`Message sent to room ${room}:`, message);
  });

  // Handle customer online status
  socket.on("customerOnline", (customerId) => {
    socket.broadcast.emit("customerOnline", customerId);
  });

  // Handle customer offline status
  socket.on("customerOffline", (customerId) => {
    socket.broadcast.emit("customerOffline", customerId);
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { customerId, isTyping } = data;
    const room = `chat_${customerId}`;
    socket.to(room).emit("userTyping", {
      userId: socket.userId,
      isTyping: isTyping,
    });
  });

  // Handle message read status
  socket.on("markAsRead", (data) => {
    const { customerId, messageId } = data;
    const room = `chat_${customerId}`;
    socket.to(room).emit("messageRead", {
      messageId: messageId,
      readBy: socket.userId,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

module.exports = {
  handleConnection,
};
