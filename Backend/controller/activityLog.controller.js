const activityLogService = require("../service/activityLog.service");

/**
 * Ghi lại một hoạt động vào collection activity_logs.
 *
 * @param {Object} options                 - Thông tin log cần ghi.
 * @param {string} options.actorClerkId    - Clerk ID của người thực hiện (bắt buộc).
 * @param {string} [options.actorEmail]    - Email của actor (nếu có).
 * @param {string} [options.actorName]     - Tên hiển thị của actor.
 * @param {string} options.action          - Mã hành động, ví dụ "booking.create".
 * @param {string} [options.targetType]    - Kiểu đối tượng bị tác động, ví dụ "Booking".
 * @param {string} [options.targetId]      - ID của đối tượng bị tác động.
 * @param {string} [options.description]   - Mô tả ngắn gọn để dễ đọc trong UI.
 * @param {Object} [options.metadata={}]   - Thông tin bổ sung (JSON tùy ý).
 * @param {string} [options.ipAddress]     - Địa chỉ IP lấy từ req.ip.
 * @param {string} [options.userAgent]     - Thông tin thiết bị lấy từ req.get("user-agent").
 */
async function logActivity({
  actorClerkId,
  actorEmail,
  actorName,
  action,
  targetType,
  targetId,
  description,
  metadata = {},
  ipAddress,
  userAgent,
}) {
  if (!actorClerkId || !action) {
    // Không đủ thông tin tối thiểu thì bỏ qua để tránh crash luồng chính
    console.warn(
      "[ActivityLog] Missing actorClerkId/action. Skip log.",
      actorClerkId,
      action
    );
    return;
  }

  try {
    await activityLogService.createLog({
      actorClerkId,
      actorEmail,
      actorName,
      action,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Không nên throw ra ngoài để tránh làm hỏng business flow
    console.error("[ActivityLog] Failed to write log:", error);
  }
}

async function createActivityLog(req, res, next) {
  try {
    const {
      action,
      targetType,
      targetId,
      description,
      metadata = {},
    } = req.body;

    if (!action) {
      return res.status(400).json({ message: "action is required" });
    }

    const actor = req.user || {};
    const created = await activityLogService.createLog({
      actorClerkId: req.userId,
      actorEmail: actor.emailAddresses?.[0]?.emailAddress,
      actorName: actor.fullName || actor.username,
      action,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return next(error);
  }
}

async function createLoginLog(req, res, next) {
  req.body.action = req.body.action || "user.login";
  req.body.description =
    req.body.description ||
    `${req.user?.fullName || "Người dùng"} đã đăng nhập`;
  return createActivityLog(req, res, next);
}

async function listActivityLogs(req, res, next) {
  try {
    const { page, limit, action, actorClerkId } = req.query;
    const result = await activityLogService.listLogs({
      page,
      limit,
      action,
      actorClerkId,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createActivityLog,
  createLoginLog,
  listActivityLogs,
  logActivity,
};
