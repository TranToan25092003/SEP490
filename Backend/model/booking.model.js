const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Bookings Schema
// Represents customer bookings for services
const BookingSchema = new Schema(
  {
    clerkId: { type: String, required: true }, // Clerk user ID
    vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true }, // Reference to Vehicles
    booking_date: { type: Date, required: true }, // Booking date and time
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed"],
      required: true,
    }, // Booking status
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
