const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Services Schema
// Represents available services (e.g., oil change, tire rotation)
const ServiceSchema = new Schema(
  {
    name: { type: String, required: true }, // Service name
    base_price: { type: Number, required: true }, // Base price of service
    description: { type: String, required: false }, // Service description (optional)
    estimated_time: { type: Number, required: true }, // Estimated time in minutes
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", ServiceSchema);

module.exports = Service;
