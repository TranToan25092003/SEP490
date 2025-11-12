const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemsSchema = new Schema(
  {
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { discriminatorKey: "item_type", _id: false }
);

const ServiceItemSchema = new Schema(
  {
    service_id: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: false,
    },
    name: { type: String, required: true },
  },
  { _id: false }
);

const PartItemSchema = new Schema(
  {
    part_id: { type: Schema.Types.ObjectId, ref: "Part", required: true },
  },
  { _id: false }
);

// Service_Orders Schema
// The main data model
const ServiceOrderSchema = new Schema(
  {
    staff_clerk_id: { type: String, required: true }, // Staff who created the order
    booking_id: { type: Schema.Types.ObjectId, ref: "Booking", required: true }, // Associated booking ID
    items: [ItemsSchema], // Array of order items (services, parts, custom)
    status: {
      type: String,
      enum: [
        "created",
        "waiting_inspection",
        "inspection_completed",
        "waiting_customer_approval",
        "approved",
        "scheduled",
        "servicing",
        "completed",
        "cancelled",
      ],
      default: "created",
      required: true,
    },
    expected_completion_time: { type: Date, required: false },
    completed_at: { type: Date, required: false },
    cancelled_at: { type: Date, required: false },
  },
  { timestamps: true }
);

ServiceOrderSchema.path("items").discriminator("service", ServiceItemSchema);
ServiceOrderSchema.path("items").discriminator("part", PartItemSchema);

ServiceOrderSchema.methods.getTotalCostBeforeTax = function () {
  return this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

ServiceOrderSchema.methods.getTaxAmount = function () {
  const totalBeforeTax = this.getTotalCostBeforeTax();
  return totalBeforeTax * 0.1;
};

ServiceOrderSchema.methods.getAmountAfterTax = function () {
  return this.getTotalCostBeforeTax() + this.getTaxAmount();
};

const ServiceOrder = mongoose.model("ServiceOrder", ServiceOrderSchema);

module.exports = {
  ServiceOrder,
};
