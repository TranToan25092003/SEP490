const { ActivityLog } = require("../model");

class ActivityLogService {
  async createLog({
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
    return ActivityLog.create({
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
  }

  async listLogs({ page = 1, limit = 20, action, actorClerkId }) {
    const filter = {};
    if (action) filter.action = action;
    if (actorClerkId) filter.actorClerkId = actorClerkId;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ActivityLog.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        currentPage: Number(page),
        itemsPerPage: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

module.exports = new ActivityLogService();
