const { InvoiceService } = require("../service/invoice.service");
const { LoyaltyService } = require("../service/loyalty.service");

class InvoiceController {
  async list(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await InvoiceService.listInvoices({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        status: status || null,
      });

      res.status(200).json({
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async listForCustomer(req, res, next) {
    try {
      const customerClerkId = req.userId;
      const invoices = await InvoiceService.listInvoicesForCustomer(
        customerClerkId
      );

      res.status(200).json({
        data: invoices,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await InvoiceService.getInvoiceById(id);

      if (!invoice) {
        return res.status(404).json({ message: "Hóa đơn không tồn tại" });
      }

      res.status(200).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async getByIdForCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const customerClerkId = req.userId;

      const invoice = await InvoiceService.getInvoiceByIdForCustomer(
        id,
        customerClerkId
      );

      if (!invoice) {
        return res
          .status(404)
          .json({ message: "Hóa đơn không tồn tại hoặc không thuộc về bạn" });
      }

      res.status(200).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentMethod, voucherCode, paidAmount } = req.body || {};
      const confirmedBy = req.userId || null;

      // Mặc định là "cash" (tiền mặt) khi staff xác nhận
      const finalPaymentMethod = paymentMethod || "cash";

      const invoice = await InvoiceService.confirmInvoicePayment(
        id,
        finalPaymentMethod,
        confirmedBy,
        { voucherCode, paidAmount }
      );

      await handleLoyaltyAfterPayment(invoice, {
        voucherCode,
        paidAmount,
        performedBy: confirmedBy,
      });

      res.status(200).json({
        data: invoice,
        message: "Đã xác nhận thanh toán cho hóa đơn",
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { voucherCode, paidAmount } = req.body || {};
      const customerClerkId = req.userId;

      // Kiểm tra hóa đơn có thuộc về customer không
      const invoice = await InvoiceService.getInvoiceByIdForCustomer(
        id,
        customerClerkId
      );

      if (!invoice) {
        return res
          .status(404)
          .json({ message: "Hóa đơn không tồn tại hoặc không thuộc về bạn" });
      }

      if (invoice.status === "paid") {
        return res.status(200).json({
          data: invoice,
          message: "Hóa đơn đã được thanh toán",
        });
      }

      // Cập nhật trạng thái thanh toán với paymentMethod là qr_code (quét QR)
      // confirmedBy = "SYSTEM" để đánh dấu là hệ thống tự động xác nhận
      const updatedInvoice = await InvoiceService.confirmInvoicePayment(
        id,
        "qr_code",
        "SYSTEM", // Hệ thống tự động xác nhận
        { voucherCode, paidAmount }
      );

      await handleLoyaltyAfterPayment(updatedInvoice, {
        voucherCode,
        paidAmount,
        performedBy: "SYSTEM",
      });

      res.status(200).json({
        data: updatedInvoice,
        message: "Đã xác nhận thanh toán thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  // Proxy endpoint để lấy danh sách giao dịch từ Sepay
  async getSepayTransactions(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const SEPAY_TOKEN = process.env.SEPAY_TOKEN;

      if (!SEPAY_TOKEN) {
        console.error("SEPAY_TOKEN is not configured");
        return res.status(500).json({
          message: "Sepay token chưa được cấu hình",
        });
      }

      const url = new URL("https://my.sepay.vn/userapi/transactions/list");
      url.searchParams.set("limit", parseInt(limit, 10));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SEPAY_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => null);
        console.error("Sepay transactions response not ok:", {
          status: response.status,
          body: errorBody,
        });
        return res.status(response.status).json({
          message: "Không thể lấy lịch sử giao dịch từ Sepay",
        });
      }

      const data = await response.json().catch(() => ({}));

      // Trả về data theo format mà frontend mong đợi
      res.status(200).json({
        message: "Lấy lịch sử giao dịch thành công!",
        data: data?.data || data || {},
      });
    } catch (error) {
      console.error("Error fetching Sepay transactions:", error);
      res.status(500).json({
        message: "Không thể lấy lịch sử giao dịch từ Sepay",
        error: error.message,
      });
    }
  }

  // Proxy endpoint để lấy chi tiết giao dịch từ Sepay
  async getSepayTransactionDetail(req, res, next) {
    try {
      const { transaction_id } = req.query;
      const SEPAY_TOKEN = process.env.SEPAY_TOKEN;

      if (!SEPAY_TOKEN) {
        return res.status(500).json({
          message: "Sepay token chưa được cấu hình",
        });
      }

      if (!transaction_id) {
        return res.status(400).json({
          message: "Thiếu transaction_id",
        });
      }

      const url = new URL("https://my.sepay.vn/userapi/transactions/details");
      url.searchParams.set("transaction_id", transaction_id);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SEPAY_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => null);
        console.error("Sepay transaction detail response not ok:", {
          status: response.status,
          body: errorBody,
        });
        return res.status(response.status).json({
          message: "Không thể lấy chi tiết giao dịch từ Sepay",
        });
      }

      const data = await response.json().catch(() => ({}));

      res.status(200).json({
        message: "Lấy chi tiết giao dịch thành công!",
        data,
      });
    } catch (error) {
      console.error("Error fetching Sepay transaction detail:", error);
      res.status(500).json({
        message: "Không thể lấy chi tiết giao dịch từ Sepay",
        error: error.message,
      });
    }
  }
}

async function handleLoyaltyAfterPayment(
  invoice,
  { voucherCode, paidAmount, performedBy }
) {
  try {
    if (!invoice || !invoice.customerClerkId) {
      return;
    }

    const amountToUse =
      paidAmount !== undefined && paidAmount !== null
        ? paidAmount
        : invoice.totalAmount;

    const clerkId =
      invoice.customerClerkId ||
      invoice.clerkId ||
      invoice?.serviceOrder?.customer_clerk_id ||
      null;

    if (!clerkId) {
      return;
    }

    const loyaltyResult = await LoyaltyService.handleInvoicePaymentSuccess({
      invoiceId: invoice.id,
      clerkId,
      amount: amountToUse,
      voucherCode,
      performedBy,
    });

    const pointsEarned = loyaltyResult?.pointsAwarded ?? 0;
    await InvoiceService.updateLoyaltyPoints(invoice.id, pointsEarned);
    if (invoice) {
      invoice.loyaltyPointsEarned = pointsEarned;
    }
  } catch (loyaltyError) {
    console.error("Failed to update loyalty after payment:", loyaltyError);
  }
}

module.exports = new InvoiceController();
