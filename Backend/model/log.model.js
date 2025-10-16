const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// SystemLogs Schema
// Represents logs of system actions and events
const SystemLogsSchema = new Schema(
  {
    clerkId: { type: String, required: false }, // Clerk user ID (optional, for user actions)
    action: { type: String, required: true }, // Action performed (e.g., "create_invoice", "update_status")
    details: { type: String, required: false }, // Additional details about the action (optional)
    timestamp: { type: Date, required: true, default: Date.now }, // Timestamp of the action
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemLogs", SystemLogsSchema);
