const { Part, GoodsReceipt, Invoice } = require("../model");

class ManagerService {
  async getDashboardData() {
    // Get total parts count
    const totalParts = await Part.countDocuments({ status: "active" });

    // Get low stock parts (quantity <= minStock)
    const lowStockParts = await Part.countDocuments({
      status: "active",
      $expr: { $lte: ["$quantity", "$minStock"] },
    });

    // Get today's goods receipts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const goodsReceiptsToday = await GoodsReceipt.countDocuments({
      receivedDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Get pending goods receipts
    const goodsReceiptsPending = await GoodsReceipt.countDocuments({
      status: "pending",
    });

    // Calculate total inventory value (sum of costPrice * quantity for all active parts)
    const parts = await Part.find({ status: "active" }).select(
      "costPrice quantity"
    );
    const totalValue = parts.reduce(
      (sum, part) => sum + (part.costPrice || 0) * (part.quantity || 0),
      0
    );

    // Get monthly revenue from goods receipts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const goodsReceipts = await GoodsReceipt.find({
      receivedDate: { $gte: sixMonthsAgo },
      status: { $in: ["approved", "completed"] },
    })
      .select("receivedDate totalAmount")
      .sort({ receivedDate: 1 });

    // Group by month
    const monthlyRevenue = {};
    goodsReceipts.forEach((receipt) => {
      const monthKey = `${receipt.receivedDate.getFullYear()}-${String(
        receipt.receivedDate.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = 0;
      }
      monthlyRevenue[monthKey] += receipt.totalAmount || 0;
    });

    // Generate last 6 months data
    const barChartData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = `T${date.getMonth() + 1}`;
      barChartData.push({
        month: monthName,
        DoanhThu: monthlyRevenue[monthKey] || 0,
      });
    }

    // Get low stock items list (top 5)
    const lowStockItemsList = await Part.find({
      status: "active",
      $expr: { $lte: ["$quantity", "$minStock"] },
    })
      .select("name quantity minStock")
      .sort({ quantity: 1 })
      .limit(5);

    // Get recent goods receipts (last 5)
    const recentGoodsReceipts = await GoodsReceipt.find()
      .select("receiptNumber receivedDate supplier totalAmount status")
      .sort({ receivedDate: -1 })
      .limit(5);

    return {
      stats: {
        totalParts,
        lowStockParts,
        goodsReceiptsToday,
        goodsReceiptsPending,
        totalValue,
        monthlyRevenue: barChartData[barChartData.length - 1]?.DoanhThu || 0,
      },
      barChartData,
      lowStockItems: lowStockItemsList.map((item) => ({
        name: item.name,
        stock: item.quantity,
        minStock: item.minStock || 0,
      })),
      recentGoodsReceipts: recentGoodsReceipts.map((receipt) => ({
        id: receipt.receiptNumber,
        date: receipt.receivedDate.toISOString().split("T")[0],
        supplier: receipt.supplier?.name || "—",
        status:
          receipt.status === "completed"
            ? "Hoàn thành"
            : receipt.status === "approved"
            ? "Đã duyệt"
            : receipt.status === "pending"
            ? "Đang xử lý"
            : receipt.status === "rejected"
            ? "Từ chối"
            : receipt.status === "cancelled"
            ? "Đã hủy"
            : receipt.status,
        amount: receipt.totalAmount || 0,
      })),
    };
  }
}

module.exports = new ManagerService();
