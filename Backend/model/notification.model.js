const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Notifications Schema
// Represents notifications sent to users
const NotificationSchema = new Schema(
  {
    clerkId: { type: String, required: true }, // Clerk user ID (recipient)
    type: {
      type: String,
      enum: ["booking", "invoice", "complaint", "other"],
      required: true,
    }, // Notification type
    title: { type: String, required: true }, // Notification title
    message: { type: String, required: true }, // Notification message
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
