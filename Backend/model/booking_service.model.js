const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// UNUSED

// Booking_Services Schema
// Represents many-to-many relationship between Bookings and Services
const BookingServiceSchema = new Schema(
  {
    booking_id: { type: Schema.Types.ObjectId, ref: "Booking", required: true }, // Reference to Bookings
    service_id: { type: Schema.Types.ObjectId, ref: "Service", required: true }, // Reference to Services
  },
  { timestamps: true }
);
const BookingService = mongoose.model("BookingService", BookingServiceSchema);
module.exports = BookingService;
