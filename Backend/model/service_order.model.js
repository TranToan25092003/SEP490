const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Service_Orders Schema
// Represents service orders created from bookings
const ServiceOrderSchema = new Schema(
  {
    booking_id: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    }, // 1:1 with Bookings
    vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true }, // Reference to Vehicles
    bay_id: { type: Schema.Types.ObjectId, ref: "Bay", required: false }, // Reference to Bays (optional)
    staff_id: [{ type: String, required: false }], // Array of Clerk user IDs for staff (optional)
    timeline: [
      {
        event: { type: String, required: true }, // Event description (e.g., "Started", "Completed")
        timestamp: { type: Date, required: true }, // Timestamp of event
      },
    ], // Timeline of service order events
    photos: [{ type: String, required: false }], // Array of photo URLs (optional)
    estimated_completion_time: { type: Date, required: false }, // Estimated completion time (optional)
    status: {
      type: String,
      enum: ["in_progress", "completed", "cancelled"],
      required: true,
    }, // Order status
    assigned_at: { type: Date, required: false }, // Time bay assigned (optional)
    released_at: { type: Date, required: false }, // Time bay released (optional)
  },
  { timestamps: true }
);

const ServiceOrder = mongoose.model("ServiceOrder", ServiceOrderSchema);

module.exports = ServiceOrder;
