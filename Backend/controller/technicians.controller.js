const { StaffService } = require("../service/staff.service");

class StaffController {
  async getTechniciansWithStatus(req, res, next) {
    try {
      const technicians = await StaffService.getTechniciansWithStatusAtThisMoment();

      res.status(200).json({
        data: technicians,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StaffController();
