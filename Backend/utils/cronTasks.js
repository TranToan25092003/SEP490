const { Test, ServiceOrder } = require("../model");
const notificationService = require("../service/notification.service");
const { UsersService } = require("../service/users.service");

const DAY_IN_MS = 24 * 60 * 60 * 1000;

async function healthCheck() {
  try {
    await Test.find({});
    console.log("System is healthy 💪💪💪");
  } catch (error) {
    console.error("Health check failed:", error);
  }
}

async function getCustomerName(clerkId) {
  if (!clerkId) return "Quý khách";
  const map = await UsersService.getFullNamesByIds([clerkId]);
  const name = map?.[clerkId];
  return name && name !== "Không có tên" ? name : "Quý khách";
}

async function sendMaintenanceReminders() {
  const now = Date.now();
  const ninetyDaysAgo = new Date(now - 90 * DAY_IN_MS);
  const sixtyDaysAgo = new Date(now - 60 * DAY_IN_MS);

  const filters = {
    status: "completed",
    completed_at: { $gte: ninetyDaysAgo, $lte: sixtyDaysAgo },
    $or: [
      { maintenance_reminder_sent_at: { $exists: false } },
      { maintenance_reminder_sent_at: null },
    ],
  };

  const serviceOrders = await ServiceOrder.find(filters)
    .limit(50)
    .populate({
      path: "booking_id",
      populate: { path: "vehicle_id" },
    })
    .exec();

  await Promise.all(
    serviceOrders.map(async (order) => {
      const booking = order.booking_id;
      const customerClerkId = booking?.customer_clerk_id;
      if (!customerClerkId) return;

      const plate = booking.vehicle_id?.license_plate || "xe của bạn";
      const customerName = await getCustomerName(customerClerkId);
      const bookingLink = "/booking";

      await notificationService.createNotification({
        recipientClerkId: customerClerkId,
        recipientType: "customer",
        type: "MAINTENANCE_REMINDER",
        title: "Đến lúc kiểm tra xe định kỳ",
        message: `Kính gửi Quý khách ${customerName}, đã đến kỳ bảo dưỡng định kỳ cho xe ${plate}. Để bảo đảm an toàn vận hành, kính mời đặt lịch tại ${bookingLink}.`,
        linkTo: bookingLink,
      });

      order.maintenance_reminder_sent_at = new Date();
      await order.save();
    })
  );
}

const runCronTasks = async () => {
  try {
    await Promise.all([healthCheck(), sendMaintenanceReminders()]);
  } catch (error) {
    console.error("Error in cron tasks:", error);
  }
};

module.exports = { runCronTasks };
