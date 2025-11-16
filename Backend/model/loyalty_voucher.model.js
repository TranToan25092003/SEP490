const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LoyaltyVoucherSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    rewardId: { type: String, required: true, index: true },
    rewardName: { type: String, required: true },
    voucherCode: { type: String, required: true, unique: true },
    pointsCost: { type: Number, required: true, min: 0 },
    value: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "VND" },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
    status: {
      type: String,
      enum: ["active", "used", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "LoyaltyTransaction",
      required: true,
    },
    redeemedAt: { type: Date },
    redeemedBy: { type: String },
  },
  { timestamps: true }
);

LoyaltyVoucherSchema.index({ voucherCode: 1 });

const LoyaltyVoucher = mongoose.model("LoyaltyVoucher", LoyaltyVoucherSchema);

module.exports = LoyaltyVoucher;
