const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Invoices Schema
// Represents invoices generated from quotes
const InvoiceSchema = new Schema(
  {
    quote_id: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
      unique: true,
    }, // 1:1 with Quotes
    clerkId: { type: String, required: false }, // Clerk user ID (optional)
    amount: { type: Number, required: true }, // Total invoice amount (after discounts)
    payment_method: {
      type: String,
      enum: ["cash", "bank_transfer"],
      required: true,
    }, // Payment method
    discount_code: { type: String, required: false }, // Discount code applied (optional)
    loyalty_points_earned: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    }, // Loyalty points earned (optional, default 0)
    status: { type: String, enum: ["paid", "unpaid"], required: true }, // Invoice status
  },
  { timestamps: true }
);
const Invoice = mongoose.model("Invoice", InvoiceSchema);
module.exports = Invoice;
