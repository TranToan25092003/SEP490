const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Recall_Vehicles Schema
// Represents many-to-many relationship between Recalls and Vehicles
const RecallVehiclesSchema = new Schema(
  {
    recall_id: { type: Schema.Types.ObjectId, ref: "Recall", required: true }, // Reference to Recalls
    vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true }, // Reference to Vehicles
  },
  { timestamps: true }
);

const RecallVehicles = mongoose.model("RecallVehicles", RecallVehiclesSchema);

module.exports = RecallVehicles;
