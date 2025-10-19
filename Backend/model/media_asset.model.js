const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Centralized media asset stored on Cloudinary (minimal)
const MediaAssetSchema = new Schema(
  {
    // Cloudinary public_id (for delete/transform)
    publicId: { type: String, required: true, index: true },

    // Cloudinary secure_url
    url: { type: String, required: true },

    // Simple kind to distinguish rendering/usage
    kind: {
      type: String,
      enum: ["image", "video", "pdf", "other"],
      default: "image",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MediaAsset", MediaAssetSchema);
