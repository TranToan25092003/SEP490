const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Goods Receipt Item Schema - Chi tiết từng sản phẩm trong phiếu nhập
const GoodsReceiptItemSchema = new Schema(
  {
    goodsReceiptId: {
      type: Schema.Types.ObjectId,
      ref: "GoodsReceipt",
      required: true,
    }, // ID phiếu nhập

    partId: {
      type: Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    }, // ID phụ tùng

    // STT - Số thứ tự trong phiếu nhập
    sequenceNumber: {
      type: Number,
      required: true,
      min: 1,
    }, // Số thứ tự (1, 2, 3, ...)

    // Thông tin sản phẩm tại thời điểm nhập (có thể khác với hiện tại)
    partName: { type: String, required: true }, // Tên phụ tùng
    partCode: { type: String, required: true }, // Mã số phụ tùng trong hệ thống

    // Đơn vị tính
    unit: {
      type: String,
      required: true,
      enum: ["cái", "bộ", "kg", "lít", "mét", "cuộn", "hộp", "thùng"],
      default: "cái",
    }, // Đơn vị tính (cái, bộ, kg, lít, ...)

    // Số lượng
    quantityOnDocument: {
      type: Number,
      required: true,
      min: 0,
    }, // Số lượng theo chứng từ (hóa đơn)

    quantityActuallyReceived: {
      type: Number,
      required: true,
      min: 0,
    }, // Số lượng thực nhập (có thể khác với chứng từ)

    // Giá và thành tiền
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    }, // Đơn giá nhập

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    }, // Thành tiền (quantityActuallyReceived * unitPrice)

    // Thông tin chất lượng
    condition: {
      type: String,
      enum: ["new", "used", "refurbished"],
      default: "new",
    }, // Tình trạng: mới, đã qua sử dụng, đã sửa chữa

    batchNumber: { type: String }, // Số lô hàng
    expiryDate: { type: Date }, // Hạn sử dụng (nếu có)

    // Ghi chú riêng cho từng sản phẩm
    notes: { type: String },

    // Trạng thái nhập kho
    status: {
      type: String,
      enum: ["pending", "received", "rejected"],
      default: "pending",
    }, // Trạng thái nhập kho của sản phẩm này
  },
  { timestamps: true }
);

// Indexes
GoodsReceiptItemSchema.index({ goodsReceiptId: 1 });
GoodsReceiptItemSchema.index({ partId: 1 });
GoodsReceiptItemSchema.index({ status: 1 });

// Pre-save middleware để tự động tính totalAmount
GoodsReceiptItemSchema.pre("save", function (next) {
  if (this.quantityActuallyReceived && this.unitPrice) {
    this.totalAmount = this.quantityActuallyReceived * this.unitPrice;
  }
  next();
});

// Virtual để tính tổng tiền của phiếu nhập
GoodsReceiptItemSchema.virtual("receiptTotal").get(function () {
  return this.totalAmount;
});

module.exports = mongoose.model("GoodsReceiptItem", GoodsReceiptItemSchema);
