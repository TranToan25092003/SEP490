const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Service_Order_Staff Schema
// Represents many-to-many relationship between Service_Orders and staff (via Clerk)
const ServiceOrderStaffSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "ServiceOrder",
      required: true,
    }, // Reference to Service_Orders
    staff_clerk_id: { type: String, required: true }, // Clerk user ID
    role: { type: String, enum: ["lead", "assistant"], required: false }, // Staff role (optional)
  },
  { timestamps: true }
);

const ServiceOrderStaff = mongoose.model(
  "ServiceOrderStaff",
  ServiceOrderStaffSchema
);

module.exports = ServiceOrderStaff;
