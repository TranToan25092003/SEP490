const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ComplaintCategory",
      required: [true, "Vui lòng chọn danh mục khiếu nại"],
    },
    categoryName: {
      type: String,
      required: true,
    },
    reply: {
      staffClerkId: { type: String },
      content: { type: String },
      repliedAt: { type: Date },
      _id: false,
    },
  },
  { timestamps: true }
);

const Complain = mongoose.model("Complaint", ComplaintSchema);
module.exports = Complain;
