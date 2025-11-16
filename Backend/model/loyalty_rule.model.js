const mongoose = require("mongoose");

const { Schema } = mongoose;

const LoyaltyRuleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    voucherDescription: { type: String, default: "" },
    voucherQuantity: { type: Number, default: 0, min: 0 },
    voucherValidityDays: { type: Number, default: 60, min: 1 },
    conversionType: {
      type: String,
      enum: ["points", "percent"],
      default: "points",
    },
    conversionValue: { type: Number, min: 0, default: 0 },
    conversionPointsAmount: { type: Number, min: 0, default: 1 },
    conversionCurrencyAmount: { type: Number, min: 0, default: 0 },
    conversionPreviewPoints: { type: Number, min: 0, default: 0 },
    validFrom: { type: Date },
    validTo: { type: Date },
    priority: { type: Number, min: 1, default: 1 },
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "archived"],
      default: "draft",
    },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

LoyaltyRuleSchema.index({ status: 1, priority: 1 });
LoyaltyRuleSchema.index({ name: "text", description: "text", voucherDescription: "text" });

module.exports = mongoose.model("LoyaltyRule", LoyaltyRuleSchema);
