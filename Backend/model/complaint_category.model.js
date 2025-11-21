const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ComplaintCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
    },
    updatedBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const ComplaintCategory = mongoose.model(
  "ComplaintCategory",
  ComplaintCategorySchema
);

module.exports = ComplaintCategory;
