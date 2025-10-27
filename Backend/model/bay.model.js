const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Bays Schema
// Represents service bays at branches
const BaySchema = new Schema(
  {
    bay_number: { type: String, required: true }, // Bay number (e.g., "Bay 1")
    description: { type: String, required: false }, // Bay description (optional)
  },
  { timestamps: true }
);
const Bay = mongoose.model("Bay", BaySchema);
module.exports = Bay;
