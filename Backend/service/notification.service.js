const { clerkClient } = require("../config/clerk"); // Giả sử bạn đã có clerkClient
const { Notification } = require("../model");


async function createNotification(notificationData) {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    // (Tùy chọn: Gửi sự kiện push notification/socket event tại đây)
    return notification;
  } catch (error) {
    console.error(`Error creating notification: ${error.message}`, notificationData);
  }
}


async function notifyAllStaffOfNewComplaint(complaint) {
  try {
    const staffUsers = await clerkClient.users.getUserList({ limit: 499 }); 
    console.log(staffUsers)
    
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

  const notificationData = {
    recipientClerkId: complaint.clerkId, 
    recipientType: "customer",
    type: "COMPLAINT_REPLIED",
    title: `Khiếu nại của bạn đã được phản hồi`,
    message: `Nhân viên đã phản hồi khiếu nại #${complaint._id.slice(-6)} của bạn.`,
    linkTo: `/customer/complaints/${complaint._id}`,
    actorClerkId: complaint.reply.staffClerkId, 
  };

  await createNotification(notificationData);
}


module.exports = {
  notifyAllStaffOfNewComplaint,
  notifyCustomerOnReply,
};