const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Service_Orders Schema
// Represents service orders created from bookings
const ServiceOrderSchema = new Schema(
  {
    order_creator_id: { type: String, required: true }, // User ID of the order creator
    order_for_id: { type: Schema.Types.ObjectId, ref: "User", required: true }, // User ID of the person the order is for
    vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true }, // Reference to Vehicles
    service_ids: [{ type: Schema.Types.ObjectId, ref: "Service", required: true }], // Array of Service IDs
    bay_id: { type: Schema.Types.ObjectId, ref: "Bay", required: false }, // Reference to Bays (optional)
    staff_id: [{ type: String, required: false }], // Array of Clerk user IDs for staff (optional)
    timeline: [
      {
        event: { type: String, required: true }, // Event description (e.g., "Started", "Completed")
        timestamp: { type: Date, required: true }, // Timestamp of event
      },
    ], // Timeline of service order events
    photos: [{ type: String, required: false }], // Array of photo URLs (optional)
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
      required: true,
    },
    estimated_completion_time: { type: Date, required: false },
    expected_start_time: { type: Date, required: true },
    started_at: { type: Date, required: false },
    completed_at: { type: Date, required: false },
    cancelled_at: { type: Date, required: false }
  },
  { timestamps: true }
);

const ServiceOrder = mongoose.model("ServiceOrder", ServiceOrderSchema);

module.exports = ServiceOrder;
