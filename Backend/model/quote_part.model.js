const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Quote_Parts Schema
// Represents many-to-many relationship between Quotes and Parts
const QuotePartSchema = new Schema(
  {
    quote_id: { type: Schema.Types.ObjectId, ref: "Quote", required: true }, // Reference to Quotes
    part_id: { type: Schema.Types.ObjectId, ref: "Part", required: true }, // Reference to Parts
    quantity: { type: Number, required: true, min: 1 }, // Quantity of parts used in the quote
  },
  { timestamps: true }
);
const QuotePart = mongoose.model("QuotePart", QuotePartSchema);
module.exports = QuotePart;
