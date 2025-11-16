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

      const invoice = await InvoiceService.confirmInvoicePayment(
        id,
        paymentMethod,
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

      // Cập nhật trạng thái thanh toán với paymentMethod mặc định là bank_transfer
      // confirmedBy = "SYSTEM" để đánh dấu là hệ thống tự động xác nhận
      const updatedInvoice = await InvoiceService.confirmInvoicePayment(
        id,
        "bank_transfer",
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
