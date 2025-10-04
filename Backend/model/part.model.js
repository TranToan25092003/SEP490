const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Parts Schema
// Represents parts used in services with inventory management
const PartSchema = new Schema(
  {
    name: { type: String, required: true }, // Part name (e.g., "Oil Filter")
    price: { type: Number, required: true }, // Part price
    description: { type: String, required: false }, // Part description (optional)
    compatible_model_ids: [
      { type: Schema.Types.ObjectId, ref: "Model", required: false },
    ], // Array of compatible vehicle models (optional)
    quantity: { type: Number, required: true, min: 0, default: 0 }, // Quantity in stock (non-negative, default 0)
  },
  { timestamps: true }
);
const Part = mongoose.model("Part", PartSchema);
module.exports = Part;
