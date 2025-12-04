const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer_clerk_id: {
      type: String,
      required: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    service_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
    ],
    slot_start_time: {
      type: Date,
      required: true,
    },
    slot_end_time: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["booked", "in_progress", "cancelled", "completed", "checked_in"],
      default: "booked",
      required: true,
    },
    service_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceOrder",
      required: false,
    },
    cancelled_by: {
      type: String,
      enum: ["customer", "staff"],
      required: false,
    },
    cancel_reason: {
      type: String,
      required: false,
    },
    cancelled_at: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema, "bookings");
module.exports = Booking;
