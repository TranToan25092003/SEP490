const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuoteSchema = new Schema(
  {
    so_id: {
      type: Schema.Types.ObjectId,
      ref: "ServiceOrder",
      required: true,
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    items: [
      new mongoose.Schema({
        type: {
          type: String,
          enum: ["part", "service"],
          required: true,
        },
        name: {
          type: String,
        },
        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },
        price: {
          type: Number,
          min: 0,
          default: 0,
        },
      }),
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
      default: "pending",
    },
    rejected_reason: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
const Quote = mongoose.model("Quote", QuoteSchema);
module.exports = Quote;
