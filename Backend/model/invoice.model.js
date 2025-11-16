const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Invoices Schema
// Represents invoices generated from service orders (and optionally quotes)
const InvoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: false,
      unique: true,
    }, // Số hóa đơn (VD: HD000001)
    quote_id: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      required: false,
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
    discount_amount: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    }, // Total discount value applied when paying
    paid_amount: {
      type: Number,
      required: false,
      min: 0,
    }, // Actual amount customer paid after discounts
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

InvoiceSchema.index(
  { quote_id: 1 },
  {
    unique: true,
    partialFilterExpression: { quote_id: { $type: "objectId" } },
  }
);

// Pre-save middleware để tự động tạo invoiceNumber
InvoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    // Tìm hóa đơn cuối cùng
    const lastInvoice = await this.constructor
      .findOne({
        invoiceNumber: new RegExp("^HD"),
      })
      .sort({ invoiceNumber: -1 });

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.slice(2));
      nextNumber = lastNumber + 1;
    }

    this.invoiceNumber = `HD${String(nextNumber).padStart(6, "0")}`;
  }
  next();
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);
module.exports = Invoice;
