const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Parts Schema
// Represents parts used in services with inventory management
const PartSchema = new Schema(
  {
    name: { type: String, required: true }, // Part name (e.g., "Oil Filter")
    code: { type: String, required: true, unique: true }, // Part code/SKU
    sellingPrice: { type: Number, required: true }, // Giá bán cho khách hàng
    costPrice: { type: Number, required: true }, // Giá nhập từ nhà cung cấp
    description: { type: String, required: false }, // Part description (optional)
    brand: { type: String, required: false }, // Part brand
    compatible_model_ids: [
      { type: Schema.Types.ObjectId, ref: "ModelVehicle", required: false },
    ], // Array of compatible vehicle models (optional)
    quantity: { type: Number, required: true, min: 0, default: 0 }, // Quantity in stock (non-negative, default 0)
    minStock: { type: Number, required: false, default: 0 }, // Minimum stock level
    maxStock: { type: Number, required: false }, // Maximum stock level
    // Media assets (images/PDFs) stored on Cloudinary
    media: [{ type: Schema.Types.ObjectId, ref: "MediaAsset" }],
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    }, // Part status
    specifications: { type: Map, of: String }, // Technical specifications
    notes: { type: String, required: false }, // Additional notes
  },
  { timestamps: true }
);

// Indexes for better performance
PartSchema.index({ name: "text", description: "text" }); // Text search
// code index is automatically created by unique: true
PartSchema.index({ brand: 1 }); // Brand lookup
PartSchema.index({ compatible_model_ids: 1 }); // Vehicle model lookup
PartSchema.index({ status: 1 }); // Status filter

const Part = mongoose.model("Part", PartSchema);
module.exports = Part;
