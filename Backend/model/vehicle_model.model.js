const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Models Schema
// Represents vehicle models (e.g., Toyota Camry, Honda Civic)
const ModelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // Model name (e.g., "Camry")
    brand: { type: String, required: true, trim: true }, // Brand name (e.g., "Toyota")
    year: { type: Number, required: false }, // Year of manufacture (optional)
    engine_type: { type: String, required: false }, // Engine type (e.g., gasoline, diesel, optional)
    description: { type: String, required: false }, // Additional description (optional)
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    }, // Model status
  },
  { timestamps: true }
);

// Index để tối ưu tìm kiếm và tránh duplicate (case-insensitive)
ModelSchema.index({ name: 1, brand: 1 });

const ModelVehicle = mongoose.model("ModelVehicle", ModelSchema, "models");
module.exports = ModelVehicle;
