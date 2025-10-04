const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Maintenance_Rules Schema
// Represents maintenance rules for vehicle models
const MaintenanceRuleSchema = new Schema(
  {
    model_id: { type: Schema.Types.ObjectId, ref: "Model", required: true }, // Reference to Models
    clerkId: { type: String, required: false }, // Clerk user ID (optional, for admin)
    km_interval: { type: Number, required: true }, // Kilometer interval for maintenance
    month_interval: { type: Number, required: true }, // Month interval for maintenance
    description: { type: String, required: false }, // Additional description (optional)
  },
  { timestamps: true }
);
const MaintenanceRule = mongoose.model(
  "MaintenanceRule",
  MaintenanceRuleSchema
);
module.exports = MaintenanceRule;
