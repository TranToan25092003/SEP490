const { WarrantyService, ERROR_CODES } = require("../service/warranty.service");

class WarrantyController {
  async createWarrantyBooking(req, res, next) {
    try {
      const { vehicleId, serviceOrderId, selectedParts, timeSlot } = req.body;
      const customerId = req.userId;

      const result = await WarrantyService.createWarrantyBooking({
        customerClerkId: customerId,
        vehicleId,
        serviceOrderId,
        selectedParts,
        timeSlot,
      });

      res.status(201).json({
        data: {
          warranty: result.warranty,
          booking: result.booking,
        },
        message: "Đặt lịch bảo hành thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserWarranties(req, res, next) {
    try {
      const customerId = req.userId;
      const warranties = await WarrantyService.getUserWarranties(customerId);

      res.status(200).json({
        data: warranties,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWarrantyById(req, res, next) {
    try {
      const { id } = req.params;
      const warranty = await WarrantyService.getWarrantyById(id);

      if (!warranty) {
        return res.status(404).json({ message: "Warranty not found" });
      }

      res.status(200).json({
        data: warranty,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkWarrantyEligibility(req, res, next) {
    try {
      const { serviceOrderId } = req.params;
      const eligibility = await WarrantyService.checkWarrantyEligibility(serviceOrderId);

      res.status(200).json({
        data: eligibility,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WarrantyController();

