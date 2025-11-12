const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actorClerkId: { type: String, required: true, index: true },
    actorEmail: { type: String },
    actorName: { type: String },
    action: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: "targetType" },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "ActivityLog",
  activityLogSchema,
  "activity_logs"
);
