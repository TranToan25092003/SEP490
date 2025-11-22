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

const WalkInCustomerSchema = new Schema(
  {
    name: { type: String, required: false },
    phone: { type: String, required: false },
    address: { type: String, required: false },
  },
  { _id: false }
);

const WalkInVehicleSchema = new Schema(
  {
    license_plate: { type: String, required: false },
    model: { type: String, required: false },
    color: { type: String, required: false },
  },
  { _id: false }
);

// Service_Orders Schema
// The main data model
const ServiceOrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: false,
      unique: true,
    }, // Số lệnh sửa chữa (VD: SC000001)
    staff_clerk_id: { type: String, required: true }, // Staff who created the order
    booking_id: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    }, // Associated booking ID
    items: [ItemsSchema], // Array of order items (services, parts, custom)
    is_walk_in: {
      type: Boolean,
      default: false,
    },
    walk_in_customer: WalkInCustomerSchema,
    walk_in_vehicle: WalkInVehicleSchema,
    walk_in_note: { type: String, required: false },
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
    cancelled_by: {
      type: String,
      enum: ["customer", "staff"],
      required: false,
    },
    cancel_reason: { type: String, required: false },
    maintenance_reminder_sent_at: { type: Date, required: false },
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

// Pre-save middleware để tự động tạo orderNumber
ServiceOrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    // Tìm lệnh sửa chữa cuối cùng
    const lastOrder = await this.constructor
      .findOne({
        orderNumber: new RegExp("^SC"),
      })
      .sort({ orderNumber: -1 });

    let nextNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.slice(2));
      nextNumber = lastNumber + 1;
    }

    this.orderNumber = `SC${String(nextNumber).padStart(6, "0")}`;
  }
  next();
});

ServiceOrderSchema.index(
  { booking_id: 1 },
  {
    unique: true,
    partialFilterExpression: { booking_id: { $exists: true, $ne: null } },
  }
);

const ServiceOrder = mongoose.model("ServiceOrder", ServiceOrderSchema);

ServiceOrder.syncIndexes().catch((error) => {
  console.error("[ServiceOrder] Failed to sync indexes:", error.message);
});

module.exports = {
  ServiceOrder,
};
