const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Vehicles Schema
// Represents customer vehicles
const VehicleSchema = new Schema(
  {
    OwnerClerkId: { type: String, required: true }, // Clerk user ID
    model_id: { type: Schema.Types.ObjectId, ref: "ModelVehicle", required: true }, // Reference to Models
    license_plate: { type: String, required: true, unique: true }, // License plate number
    odo_reading: { type: Number, required: true }, // Odometer reading
    year: { type: Number, required: true }, // Year of vehicle
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", VehicleSchema);
module.exports = Vehicle;
