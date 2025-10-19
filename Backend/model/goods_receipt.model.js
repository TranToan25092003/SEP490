const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Goods Receipt Schema - Phiếu nhập kho
const GoodsReceiptSchema = new Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    }, // Số phiếu nhập (VD: PN2025010001)

    // Thông tin công ty (cho PDF)
    companyInfo: {
      name: { type: String, default: "MOTORMATE" },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
      taxCode: { type: String }, // Mã số thuế
    },

    // Thông tin nhà cung cấp chi tiết hơn
    supplier: {
      name: { type: String, required: true }, // Tên nhà cung cấp
      contact: { type: String }, // Liên hệ
      address: { type: String }, // Địa chỉ
      phone: { type: String }, // Số điện thoại
      taxCode: { type: String }, // Mã số thuế nhà cung cấp
    },

    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Người nhận hàng

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }, // Người duyệt phiếu

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    }, // Trạng thái phiếu nhập

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    }, // Tổng tiền phiếu nhập

    notes: { type: String }, // Ghi chú

    // Ngày nhập hàng thực tế
    receivedDate: {
      type: Date,
      default: Date.now,
    },

    // Ngày tạo phiếu nhập
    documentDate: {
      type: Date,
      default: Date.now,
    }, // Ngày tạo phiếu nhập (có thể khác với receivedDate)

    // Địa điểm nhập kho
    warehouseLocation: {
      type: String,
      default: "Kho chính",
    }, // Địa điểm nhập kho

    // File đính kèm (hóa đơn, chứng từ)
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
  },
  { timestamps: true }
);

// Indexes
GoodsReceiptSchema.index({ receiptNumber: 1 });
GoodsReceiptSchema.index({ status: 1 });
GoodsReceiptSchema.index({ receivedDate: -1 });
GoodsReceiptSchema.index({ "supplier.name": 1 });

// Pre-save middleware để tự động tạo receiptNumber
GoodsReceiptSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Tìm số phiếu nhập cuối cùng trong tháng
    const lastReceipt = await this.constructor
      .findOne({
        receiptNumber: new RegExp(`^PN${year}${month}`),
      })
      .sort({ receiptNumber: -1 });

    let nextNumber = 1;
    if (lastReceipt) {
      const lastNumber = parseInt(lastReceipt.receiptNumber.slice(-4));
      nextNumber = lastNumber + 1;
    }

    this.receiptNumber = `PN${year}${month}${String(nextNumber).padStart(
      4,
      "0"
    )}`;
  }
  next();
});

module.exports = mongoose.model("GoodsReceipt", GoodsReceiptSchema);
