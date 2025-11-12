// Store active customers and their info
const activeCustomers = new Map(); // customerId -> { socketId, name, userType, lastSeen, room }
// In-memory chat history per customer
const chatHistoryByCustomer = new Map();
const MAX_MESSAGES_PER_CHAT = 100;
let guestCounter = 0; // server-scoped incremental counter for Guest naming
let ioInstance = null; // Store io instance for broadcasting

// Socket.IO event handlers
const handleConnection = (socket) => {
  console.log("User connected:", socket.id);

  // Handle joining a room (customer or staff)
  socket.on("joinRoom", (data) => {
    const { room, userId, userType, customerName } = data;
    socket.join(room);
    socket.userId = userId;
    socket.userType = userType;
    console.log(`User ${userId} (${userType}) joined room ${room}`);

    // If customer joins, store their info. For guest, delay notifying staff until first message
    if (userType === "customer" && userId) {
      // Determine if this is a guest based on userId convention
      const isGuest = typeof userId === "string" && userId.startsWith("guest_");
      // Assign a stable server-side Guest name; ignore client-provided Guest name to avoid duplicates
      let assignedName = customerName;
      if (isGuest) {
        if (!activeCustomers.has(userId)) {
          guestCounter += 1;
          assignedName = `Guest ${guestCounter}`;
        } else {
          assignedName = activeCustomers.get(userId).name;
        }
      } else if (!assignedName) {
        assignedName = userId; // fallback to userId when not guest and no name provided
      }

      activeCustomers.set(userId, {
        socketId: socket.id,
        name: assignedName,
        userType: isGuest ? "guest" : "customer",
        lastSeen: new Date(),
        room: room,
      });

      // Notify staff for non-guest customers immediately; guests will be notified on first message
      if (!isGuest) {
        socket.to("staff_room").emit("newCustomer", {
          customerId: userId,
          name: assignedName,
          userType: "customer",
        });
      }
    }

    // If staff joins, notify them about all active customers
    if (userType === "staff") {
      socket.join("staff_room");
      console.log(`Staff ${userId} joined staff_room`);
      const customers = Array.from(activeCustomers.entries())
        .filter(([id, info]) => {
          // hide guest rooms until they have at least one message
          if (info.userType === "guest") {
            const history = chatHistoryByCustomer.get(id) || [];
            return history.length > 0;
          }
          return true;
        })
        .map(([id, info]) => ({
          customerId: id,
          name: info.name,
          userType: info.userType,
          lastSeen: info.lastSeen,
        }));
      socket.emit("activeCustomers", customers);
      console.log(`Sent ${customers.length} active customers to staff`);
    }

    // Emit chat history when joining a specific chat room
    try {
      if (room && room.startsWith("chat_")) {
        const customerIdFromRoom = room.replace(/^chat_/, "");
        const history = chatHistoryByCustomer.get(customerIdFromRoom) || [];
        socket.emit("chatHistory", {
          customerId: customerIdFromRoom,
          messages: history,
        });
      }
    } catch (_err) {}
  });

  // Handle sending messages
  socket.on("sendMessage", (data) => {
    const { customerId, message } = data;
    const room = `chat_${customerId}`;
    const isStaff = socket.userType === "staff";

    // Update customer's last activity if customer sends
    if (!isStaff && activeCustomers.has(customerId)) {
      const customerInfo = activeCustomers.get(customerId);
      customerInfo.lastSeen = new Date();
      activeCustomers.set(customerId, customerInfo);
    }

    if (isStaff) {
      // Staff sending to customer: broadcast to customer room only
      socket.to(room).emit("newMessage", { ...message, customerId });
      // Also emit to sender (staff) so they see their own message
      socket.emit("newMessage", { ...message, customerId });
      // Save to in-memory history
      const listStaff = chatHistoryByCustomer.get(customerId) || [];
      listStaff.push(message);
      if (listStaff.length > MAX_MESSAGES_PER_CHAT)
        listStaff.splice(0, listStaff.length - MAX_MESSAGES_PER_CHAT);
      chatHistoryByCustomer.set(customerId, listStaff);
      console.log(
        `Staff message sent to room ${room} for customer ${customerId}`
      );
    } else {
      // Customer sending: broadcast to customer room and notify staff room
      socket.to(room).emit("newMessage", { ...message, customerId });
      // Use io.to() to ensure all staff in staff_room receive the message
      if (ioInstance) {
        ioInstance
          .to("staff_room")
          .emit("newMessage", { ...message, customerId });
        console.log(
          `Emitted message from customer ${customerId} to staff_room via io.to()`
        );
      } else {
        socket.to("staff_room").emit("newMessage", { ...message, customerId });
        console.log(
          `Emitted message from customer ${customerId} to staff_room via socket.to()`
        );
      }
      // Also emit to sender (customer) so they see their own message
      socket.emit("newMessage", { ...message, customerId });
      // Save to in-memory history
      const listCus = chatHistoryByCustomer.get(customerId) || [];
      const wasEmpty = listCus.length === 0;
      listCus.push(message);
      if (listCus.length > MAX_MESSAGES_PER_CHAT)
        listCus.splice(0, listCus.length - MAX_MESSAGES_PER_CHAT);
      chatHistoryByCustomer.set(customerId, listCus);
      // If first message from a guest, now announce to staff list
      const info = activeCustomers.get(customerId);
      if (wasEmpty && info && info.userType === "guest") {
        const payload = { customerId, name: info.name, userType: "guest" };
        if (ioInstance)
          ioInstance.to("staff_room").emit("newCustomer", payload);
        else socket.to("staff_room").emit("newCustomer", payload);
        console.log(
          `Announced new guest conversation ${customerId} to staff_room`
        );
      }
      console.log(`Customer ${customerId} sent message to room ${room}`);
    }
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

  //Handle join room for notification
  socket.on("joinRoomNotification", (roomName) => {
    console.log(`Socket ${socket.id} joining notification room: ${roomName}`);
    socket.join(roomName);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove customer from active list if they disconnect
    if (socket.userId && socket.userType === "customer") {
      activeCustomers.delete(socket.userId);
      socket.to("staff_room").emit("customerOffline", socket.userId);
    }
  });
};

// Function to set io instance
const setIOInstance = (io) => {
  ioInstance = io;
};

module.exports = {
  handleConnection,
  setIOInstance,
};
