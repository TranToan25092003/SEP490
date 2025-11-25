const { BayService } = require("../service/bays.service");
const { BaySchedulingService } = require("../service/bay_scheduling.service");

class BaysController {
  async getAllBays(_, res, next) {
    try {
      const availableBays = await BayService.getAllBays();
      res.json({
        data: availableBays,
        message: "Available bays retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  }

 async getNSlots(req, res, next) {
    try {
      const { id } = req.params;
      const { n, duration, ignoredTaskIds } = req.query;

      const slots = await BaySchedulingService.findNextNSlotsForBayId(
        id,
        parseInt(n, 10),
        parseInt(duration, 10),
        req.query.from ? new Date(req.query.from) : undefined,
        ignoredTaskIds
      )

      res.json({
        data: slots,
        message: "Available slots for bay retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BaysController();
