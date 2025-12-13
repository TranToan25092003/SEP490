const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LoyaltyTransactionSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["earn", "redeem", "adjust"],
      required: true,
    },
    points: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, required: true },
    sourceRef: {
      kind: {
        type: String,
        enum: ["invoice", "booking", "manual", "voucher", "checkin"],
        default: "manual",
      },
      refId: { type: Schema.Types.ObjectId, required: false },
    },
    expiresAt: { type: Date, required: false },
    performedBy: { type: String, required: false }, // admin/staff clerkId
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

LoyaltyTransactionSchema.index({ clerkId: 1, createdAt: -1 });

const LoyaltyTransaction = mongoose.model(
  "LoyaltyTransaction",
  LoyaltyTransactionSchema
);

module.exports = LoyaltyTransaction;
