const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Warranties Schema
// Represents warranties for service orders or parts
const WarrantySchema = new Schema(
  {
    so_id: {
      type: Schema.Types.ObjectId,
      ref: "ServiceOrder",
      required: true,
    }, // Reference to Service_Orders (original service order)
    booking_id: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    }, // Reference to Booking (warranty booking)
    vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true }, // Reference to Vehicles
    clerkId: { type: String, required: false }, // Clerk user ID (optional)
    start_date: { type: Date, required: true }, // Warranty start date
    end_date: { type: Date, required: true }, // Warranty end date
    description: { type: String, required: false }, // Warranty description (optional)
    status: {
      type: String,
      enum: ["active", "expired", "used"],
      required: true,
    }, // Warranty status
    conditions: { type: String, required: false }, // Warranty conditions/terms (optional, e.g., "6   months or 10,000 km")
    warranty_parts: [
      {
        part_id: {
          type: Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        }, // Reference to Part
        part_name: { type: String, required: true }, // Part name for reference
        quantity: { type: Number, required: true, default: 1 }, // Quantity of parts under warranty
      },
    ], // List of parts under warranty
  },
  { timestamps: true }
);

const Warranty = mongoose.model("Warranty", WarrantySchema);
module.exports = Warranty;
