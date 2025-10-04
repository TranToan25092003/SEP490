const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// LoyaltyPoints Schema
// Represents total loyalty points for each customer
const LoyaltyPointsSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true }, // Clerk user ID
    total_points: { type: Number, required: true, min: 0, default: 0 }, // Total loyalty points accumulated
    updated_at: { type: Date, required: true, default: Date.now }, // Last updated timestamp
  },
  { timestamps: true }
);
const LoyalPoint = mongoose.model("LoyaltyPoints", LoyaltyPointsSchema);
module.exports = LoyalPoint;
