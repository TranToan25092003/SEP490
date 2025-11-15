const dashboardService = require("../../service/staff/dashboard.service"); // Đảm bảo đường dẫn chính xác

class DashboardController {

  async getStaffDashboardData(req, res) {
    try {
      const dashboardData = await dashboardService.getStaffDashboardData(req.query);

      res.status(200).json({
        success: true,
        data: dashboardData, 
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch dashboard data.",
      });
    }
  }
}

module.exports = new DashboardController();