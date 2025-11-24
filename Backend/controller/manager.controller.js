const managerService = require("../service/manager.service");

class ManagerController {
  async getDashboard(req, res, next) {
    try {
      const data = await managerService.getDashboardData();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ManagerController();

