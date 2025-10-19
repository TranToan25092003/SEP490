const express = require("express");
const router = express.Router();
const GoodsReceipt = require("../../model/goods_receipt.model");
const GoodsReceiptItem = require("../../model/goods_receipt_item.model");
const Part = require("../../model/part.model");
const { authenticate } = require("../../middleware/guards/authen.middleware");
const { roleProtected } = require("../../middleware/guards/role.middleware");

// Apply authentication and role middleware to all routes
// router.use(authenticate);
// router.use(roleProtected);

// Create goods receipt
router.post("/", async (req, res) => {
  try {
    const {
      supplier,
      warehouseLocation,
      notes,
      receivedDate,
      documentDate,
      totalAmount,
      items,
    } = req.body;

    // Validate required fields
    if (!supplier?.name || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Create goods receipt
    const goodsReceipt = new GoodsReceipt({
      supplier,
      warehouseLocation: warehouseLocation || "Kho chính",
      notes,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      documentDate: documentDate ? new Date(documentDate) : new Date(),
      totalAmount,
      receivedBy: req.user.id,
      status: "completed",
    });

    await goodsReceipt.save();

    // Create goods receipt items and update part quantities
    const receiptItems = [];
    for (const item of items) {
      // Create receipt item
      const receiptItem = new GoodsReceiptItem({
        goodsReceiptId: goodsReceipt._id,
        partId: item.partId,
        sequenceNumber: item.sequenceNumber,
        partName: item.partName,
        partCode: item.partCode,
        unit: item.unit,
        quantityOnDocument: item.quantityOnDocument,
        quantityActuallyReceived: item.quantityActuallyReceived,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
        condition: item.condition || "new",
        notes: item.notes,
        status: item.status || "received",
      });

      await receiptItem.save();
      receiptItems.push(receiptItem);

      // Update part quantity in inventory
      await Part.findByIdAndUpdate(
        item.partId,
        {
          $inc: { quantity: item.quantityActuallyReceived },
          $set: { costPrice: item.unitPrice }, // Update cost price
        },
        { new: true }
      );
    }

    // Populate the receipt with items
    const populatedReceipt = await GoodsReceipt.findById(goodsReceipt._id)
      .populate("receivedBy", "name email")
      .populate("approvedBy", "name email");

    res.status(201).json({
      success: true,
      message: "Phiếu nhập kho đã được tạo thành công",
      receipt: populatedReceipt,
      items: receiptItems,
    });
  } catch (error) {
    console.error("Error creating goods receipt:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo phiếu nhập kho",
      error: error.message,
    });
  }
});

// Get all goods receipts
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    const receipts = await GoodsReceipt.find(filter)
      .populate("receivedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GoodsReceipt.countDocuments(filter);

    res.json({
      success: true,
      receipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching goods receipts:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách phiếu nhập kho",
      error: error.message,
    });
  }
});

// Get goods receipt by ID
router.get("/:id", async (req, res) => {
  try {
    const receipt = await GoodsReceipt.findById(req.params.id)
      .populate("receivedBy", "name email")
      .populate("approvedBy", "name email");

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiếu nhập kho",
      });
    }

    // Get receipt items
    const items = await GoodsReceiptItem.find({
      goodsReceiptId: receipt._id,
    }).sort({ sequenceNumber: 1 });

    res.json({
      success: true,
      receipt,
      items,
    });
  } catch (error) {
    console.error("Error fetching goods receipt:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin phiếu nhập kho",
      error: error.message,
    });
  }
});

// Update goods receipt
router.patch("/:id", async (req, res) => {
  try {
    const { pdfUrl } = req.body;

    const receipt = await GoodsReceipt.findByIdAndUpdate(
      req.params.id,
      { pdfUrl },
      { new: true }
    );

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiếu nhập kho",
      });
    }

    res.json({
      success: true,
      message: "Phiếu nhập kho đã được cập nhật",
      receipt,
    });
  } catch (error) {
    console.error("Error updating goods receipt:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật phiếu nhập kho",
      error: error.message,
    });
  }
});

// Delete goods receipt
router.delete("/:id", async (req, res) => {
  try {
    const receipt = await GoodsReceipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiếu nhập kho",
      });
    }

    // Get all items in this receipt
    const items = await GoodsReceiptItem.find({
      goodsReceiptId: receipt._id,
    });

    // Reverse the inventory updates
    for (const item of items) {
      await Part.findByIdAndUpdate(
        item.partId,
        {
          $inc: { quantity: -item.quantityActuallyReceived },
        },
        { new: true }
      );
    }

    // Delete receipt items
    await GoodsReceiptItem.deleteMany({
      goodsReceiptId: receipt._id,
    });

    // Delete the receipt
    await GoodsReceipt.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Phiếu nhập kho đã được xóa thành công",
    });
  } catch (error) {
    console.error("Error deleting goods receipt:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa phiếu nhập kho",
      error: error.message,
    });
  }
});

module.exports = router;
