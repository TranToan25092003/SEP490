const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Quotes Schema
// Represents quotes for service orders
const QuoteSchema = new Schema(
  {
    so_id: {
      type: Schema.Types.ObjectId,
      ref: "ServiceOrder",
      required: true,
      unique: true,
    }, // 1:1 with Service_Orders
    total_amount: { type: Number, required: true }, // Total quote amount
    labor_cost: { type: Number, required: true }, // Labor cost for the service
    tax: { type: Number, required: true }, // Tax amount
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
    }, // Quote status
  },
  { timestamps: true }
);
const Quote = mongoose.model("Quote", QuoteSchema);
module.exports = Quote;
