const { QuotesService } = require("../service/quotes.service");

class QuotesController {
  /**
   * List all quotes with pagination
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  async listQuotes(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const serviceOrderId = req.query.serviceOrderId || null;

      const result = await QuotesService.listQuotes(page, limit, serviceOrderId);

      res.status(200).json({
        message: "Danh sách báo giá",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a quote by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  async getQuoteById(req, res, next) {
    try {
      const quote = await QuotesService.getQuoteById(req.params.id);

      if (!quote) {
        return res.status(404).json({
          message: "Báo giá không tồn tại",
        });
      }

      res.status(200).json({
        message: "Chi tiết báo giá",
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a quote from a service order
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  async createQuote(req, res, next) {
    try {
      const quote = await QuotesService.createQuote(req.params.serviceOrderId);

      res.status(201).json({
        message: "Tạo báo giá thành công",
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a quote
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  async approveQuote(req, res, next) {
    try {
      const quote = await QuotesService.approveQuote(req.params.id);

      res.status(200).json({
        message: "Phê duyệt báo giá thành công",
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a quote with a reason
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  async rejectQuote(req, res, next) {
    try {
      const quote = await QuotesService.rejectQuote(
        req.params.id,
        req.body.reason
      );

      res.status(200).json({
        message: "Từ chối báo giá thành công",
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuotesController();
