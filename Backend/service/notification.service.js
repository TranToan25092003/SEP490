const { clerkClient } = require("../config/clerk");
const { Notification } = require("../model");
const { emitToRoom } = require("../socket/socketUtils");


async function createNotification(notificationData) {
  try {
    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();

    if (savedNotification) {
      const roomName = savedNotification.recipientClerkId;
      const eventName = "new_notification";
      const payload = savedNotification.toObject();
      emitToRoom(roomName, eventName, payload);
    }

    return savedNotification;
  } catch (error) {
    console.error(`Error creating notification: ${error.message}`, notificationData);
  }
}


async function notifyAllStaffOfNewComplaint(complaint) {
  try {
    const staffUsers = await clerkClient.users.getUserList({ limit: 499 });

    const staffIds = staffUsers.data
      .filter(user => user.publicMetadata?.role === 'staff')
      .map(user => user.id);

    if (staffIds.length === 0) return;

    const notificationPayload = {
      recipientType: "staff",
      type: "NEW_COMPLAINT_RECEIVED",
      title: `Khiếu nại mới: ${complaint.title}`,
      message: `Khách hàng vừa gửi một khiếu nại mới về ${complaint.category}.`,
      linkTo: `/staff/complaints/${complaint._id}`,
      actorClerkId: complaint.clerkId,
    };


    const promises = staffIds.map(staffId => {
      return createNotification({
        ...notificationPayload,
        recipientClerkId: staffId,
      });
    });

    await Promise.all(promises);

  } catch (error) {
    console.error("Failed to notify all staff:", error);
  }
}


async function notifyCustomerOnReply(complaint) {
  if (!complaint || !complaint.reply) return;
  console.log("notifyCustomerOnReply: ", complaint)
  const notificationData = {
    recipientClerkId: complaint.clerkId,
    recipientType: "customer",
    type: "COMPLAINT_REPLIED",
    title: `Khiếu nại của bạn đã được phản hồi`,
    message: `Nhân viên đã phản hồi khiếu nại #${complaint._id.toString().slice(-6)} của bạn.`,
    linkTo: `/customer/complaints/${complaint._id}`,
    actorClerkId: complaint.reply.staffClerkId,
  };

  await createNotification(notificationData);
}

async function getNotificationsByRecipient(recipientClerkId, query = {}) {
  const {
    page = 1,
    limit = 5,
    isRead, // Thêm isRead
  } = query;

  if (!recipientClerkId) {
    throw new Error("Recipient Clerk ID is required.");
  }

  try {
    const filter = { recipientClerkId: recipientClerkId };
    const sort = { createdAt: -1 };

    if (isRead === 'false') {
      filter.isRead = false;
    }
  
    const notifications = await Notification.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(filter);

    return {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
}

async function getUnreadNotificationCount(recipientClerkId) {
  if (!recipientClerkId) {
    throw new Error("Recipient Clerk ID is required.");
  }

  try {
    const count = await Notification.countDocuments({
      recipientClerkId: recipientClerkId,
      isRead: false
    });
    return count;
  } catch (error) {
    throw new Error(`Failed to get unread notification count: ${error.message}`);
  }
}

async function markNotificationsAsRead(recipientClerkId, notificationIds) {
  if (!recipientClerkId || !notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new Error("Recipient ID and notification IDs array are required.");
  }

  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipientClerkId: recipientClerkId
      },
      { $set: { isRead: true } }
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
}


module.exports = {
  notifyAllStaffOfNewComplaint,
  notifyCustomerOnReply,
  getNotificationsByRecipient,
  getUnreadNotificationCount,
  markNotificationsAsRead,
};