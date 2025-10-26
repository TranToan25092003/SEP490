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
      default: 1
    }
  },
  { discriminatorKey: "item_type", _id: false }
);

const ServiceItemSchema = new Schema({
  service_id: { type: Schema.Types.ObjectId, ref: "Service", required: true },
}, { _id: false });

const PartItemSchema = new Schema({
  part_id: { type: Schema.Types.ObjectId, ref: "Part", required: true },
}, { _id: false });

const CustomItemSchema = new Schema({
  description: { type: String, required: true },
}, { _id: false });

const ServiceOrderItem = ItemsSchema.discriminator("service", ServiceItemSchema);
const PartOrderItem = ItemsSchema.discriminator("part", PartItemSchema);
const CustomOrderItem = ItemsSchema.discriminator("custom", CustomItemSchema);

// Service_Orders Schema
// The main data model
const ServiceOrderSchema = new Schema(
  {
    order_creator_id: { type: String, required: true }, // User ID of the order creator
    order_for_id: { type: String, required: true }, // User ID for whom the order is made
    vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true }, // The vehicle being serviced
    items: [ItemsSchema], // Array of order items (services, parts, custom)
    status: {
      type: String,
      enum: [
        "booked",
        "waiting_customer_approval",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "booked",
      required: true,
    },
    expected_start_time: { type: Date, required: true }, // denormalized for convenience, not used in business logic, remember to update!!!!
    started_at: { type: Date, required: false },
    expected_completion_time: { type: Date, required: false },
    completed_at: { type: Date, required: false },
    cancelled_at: { type: Date, required: false },
  },
  { timestamps: true }
);

ServiceOrderSchema.methods.getTotalCostBeforeTax = function () {
  return this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

const ServiceOrder = mongoose.model("ServiceOrder", ServiceOrderSchema);

module.exports = {
  ServiceOrder,
  ServiceOrderItem,
  PartOrderItem,
  CustomOrderItem,
};
