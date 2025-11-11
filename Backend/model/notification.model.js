const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const NotificationType = [
    "BOOKING_CONFIRMED",   
    "BOOKING_COMPLETED",     
    "BOOKING_REMINDER",       
    "COMPLAINT_REPLIED",     
    "MAINTENANCE_REMINDER",  

    "NEW_BOOKING_CREATED",   
    "NEW_COMPLAINT_RECEIVED",
    "SERVICE_ORDER_ASSIGNED",
    "STOCK_LEVEL_LOW",       

    "GENERAL_ANNOUNCEMENT",  
    "OTHER"                  
];

const NotificationSchema = new Schema(
    {
        recipientClerkId: { 
            type: String, 
            required: true,
            index: true 
        }, 
        recipientType: {
            type: String,
            enum: ['customer', 'staff'],
            required: [true, "Recipient type (customer or staff) is required"],
            index: true
        },
        type: {
            type: String,
            enum: NotificationType,
            required: true,
        },
        title: { 
            type: String, 
            required: true 
        }, 
        message: { 
            type: String, 
            required: true 
        }, 
        
        isRead: {
            type: Boolean,
            default: false,
            required: true
        },

        linkTo: {
            type: String,
            required: false 
        },
        
        actorClerkId: {
            type: String,
            required: false
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;