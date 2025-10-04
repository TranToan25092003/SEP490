const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Banners Schema
// Represents banners displayed on the website
const BannerSchema = new Schema(
  {
    title: { type: String, required: true }, // Banner title (e.g., "Summer Sale")
    image_url: { type: String, required: true }, // URL of the banner image
    link_url: { type: String, required: false }, // URL to redirect when clicked (optional)
    is_active: { type: Boolean, required: true, default: true }, // Active status for display
    display_order: { type: Number, required: true, default: 0 }, // Display order on website
  },
  { timestamps: true }
);
const Banner = mongoose.model("Banner", BannerSchema);
module.exports = Banner;
