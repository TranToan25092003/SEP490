const mongoose = require("mongoose");

const { Schema } = mongoose;

const LoyaltyRuleAuditSchema = new Schema(
  {
    ruleId: {
      type: Schema.Types.ObjectId,
      ref: "LoyaltyRule",
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "status", "delete"],
      required: true,
    },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    actorId: { type: String, default: null },
    actorName: { type: String, default: null },
    actorEmail: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

LoyaltyRuleAuditSchema.index({ ruleId: 1, createdAt: -1 });

module.exports = mongoose.model("LoyaltyRuleAudit", LoyaltyRuleAuditSchema);
