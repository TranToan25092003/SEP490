const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationType = [
  "PASSWORD_CHANGED",
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "BOOKING_COMPLETED",
  "BOOKING_REMINDER",
  "COMPLAINT_SUBMITTED",
  "COMPLAINT_REPLIED",
  "MAINTENANCE_REMINDER",
  "NEW_BOOKING_CREATED",
  "NEW_SERVICE_ORDER",
  "NEW_COMPLAINT_RECEIVED",
  "SERVICE_ORDER_ASSIGNED",
  "SERVICE_ORDER_STATUS_UPDATED",
  "QUOTE_READY",
  "QUOTE_APPROVED",
  "QUOTE_REVISION_REQUESTED",
  "QUOTE_REVISED",
  "QUOTE_DECLINED",
  "QUOTE_ADDITIONAL_REQUESTED",
  "QUOTE_ADDITIONAL_APPROVED",
  "QUOTE_ADDITIONAL_DECLINED",
  "CHAT_MESSAGE",
  "WARRANTY_BOOKING_CONFIRMED",
  "WARRANTY_REQUEST_ACCEPTED",
  "WARRANTY_REQUEST_REJECTED",
  "STOCK_LEVEL_LOW",
  "PAYMENT_SUCCESSFUL",
  "PAYMENT_CONFIRMED",
  "CAMPAIGN_ANNOUNCEMENT",
  "GENERAL_ANNOUNCEMENT",
  "OTHER",
];

const NotificationSchema = new Schema(
  {
    recipientClerkId: {
      type: String,
      required: true,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ["customer", "staff"],
      required: [true, "Recipient type (customer or staff) is required"],
      index: true,
    },
    type: {
      type: String,
      enum: NotificationType,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },

    linkTo: {
      type: String,
      required: false,
    },

    actorClerkId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
