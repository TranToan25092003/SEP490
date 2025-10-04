const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Complaints Schema
// Represents customer complaints
const ComplaintSchema = new Schema(
  {
    so_id: { type: Schema.Types.ObjectId, ref: "ServiceOrder", required: true }, // Reference to Service_Orders
    clerkId: { type: String, required: true }, // Clerk user ID
    title: { type: String, required: true }, // Complaint title
    content: { type: String, required: true }, // Complaint content
    photos: [{ type: String, required: false }], // Array of photo URLs (optional)
    rating: { type: Number, required: false, min: 1, max: 5 }, // Rating (1-5 stars, optional)
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      required: true,
    }, // Complaint status
  },
  { timestamps: true }
);

const Complain = mongoose.model("Complaint", ComplaintSchema);
module.exports = Complain;
