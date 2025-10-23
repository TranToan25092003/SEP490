const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Models Schema
// Represents vehicle models (e.g., Toyota Camry, Honda Civic)
const ModelSchema = new Schema(
  {
    name: { type: String, required: true }, // Model name (e.g., "Camry")
    brand: { type: String, required: true }, // Brand name (e.g., "Toyota")
    year: { type: Number, required: false }, // Year of manufacture (optional)
    engine_type: { type: String, required: false }, // Engine type (e.g., gasoline, diesel, optional)
    description: { type: String, required: false }, // Additional description (optional)
  },
  { timestamps: true }
);

const ModelVehicle = mongoose.model("ModelVehicle", ModelSchema, "models");
module.exports = ModelVehicle;
