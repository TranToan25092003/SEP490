const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Invoices Schema
// Represents invoices generated from service orders (and optionally quotes)
const InvoiceSchema = new Schema(
  {
    quote_id: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      required: false,
      unique: true,
      sparse: true,
    }, // Optional link to a quote
    service_order_id: {
      type: Schema.Types.ObjectId,
      ref: "ServiceOrder",
      required: true,
      unique: true,
    }, // 1:1 with service orders
    clerkId: { type: String, required: false }, // Clerk user ID (optional)
    subtotal: { type: Number, required: true }, // Amount before tax
    tax: { type: Number, required: true }, // Tax amount
    amount: { type: Number, required: true }, // Total invoice amount (after tax)
    payment_method: {
      type: String,
      enum: ["cash", "bank_transfer"],
      required: false,
    }, // Payment method
    discount_code: { type: String, required: false }, // Discount code applied (optional)
    loyalty_points_earned: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    }, // Loyalty points earned (optional, default 0)
    status: {
      type: String,
      enum: ["paid", "unpaid"],
      required: true,
      default: "unpaid",
    }, // Invoice status
    confirmed_by: { type: String, required: false }, // Staff clerk ID who confirmed payment
    confirmed_at: { type: Date, required: false }, // Confirmation timestamp
  },
  { timestamps: true }
);
const Invoice = mongoose.model("Invoice", InvoiceSchema);
module.exports = Invoice;
