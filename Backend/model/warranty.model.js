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
    }, // Reference to Service_Orders
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
  },
  { timestamps: true }
);

const Warranty = mongoose.model("Warranty", WarrantySchema);
module.exports = Warranty;
