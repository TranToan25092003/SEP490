const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Recalls Schema
// Represents vehicle recall campaigns
const RecallSchema = new Schema(
  {
    description: { type: String, required: true }, // Description of recall issue (e.g., "Faulty brake system")
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      required: true,
    }, // Recall campaign status
    start_date: { type: Date, required: true }, // Start date of recall campaign
    end_date: { type: Date, required: false }, // End date of recall campaign (optional)
    notes: { type: String, required: false }, // Additional notes (optional)
  },
  { timestamps: true }
);

const Recall = mongoose.model("Recall", RecallSchema);
module.exports = Recall;
