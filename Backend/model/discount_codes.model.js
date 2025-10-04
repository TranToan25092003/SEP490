const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// DiscountCodes Schema
// Represents discount codes for invoices
const DiscountCodesSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // Unique discount code (e.g., "SAVE10")
    discount_value: { type: Number, required: true, min: 0 }, // Discount value (e.g., 10 for 10% or 100000 for 100,000 VND)
    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    }, // Discount type (percentage or fixed amount)
    valid_from: { type: Date, required: true }, // Start date of discount validity
    valid_until: { type: Date, required: true }, // End date of discount validity
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      required: true,
    }, // Discount code status
  },
  { timestamps: true }
);

const DiscountCode = mongoose.model("DiscountCodes", DiscountCodesSchema);

module.exports = DiscountCode;
