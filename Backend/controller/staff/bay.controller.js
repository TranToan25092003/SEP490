const bayService = require("../../service/staff/bay.service");

class BayController {
  async listBays(req, res) {
    try {
      const result = await bayService.listBays(req.query);
      res.status(200).json({
        success: true,
        data: result.bays,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch bays",
      });
    }
  }

  async createBay(req, res) {
    try {
      const bay = await bayService.createBay(req.body);
      res.status(201).json({ success: true, data: bay });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create bay",
      });
    }
  }

  async updateBay(req, res) {
    try {
      const bay = await bayService.updateBay(req.params.id, req.body);
      res.status(200).json({ success: true, data: bay });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update bay",
      });
    }
  }

  async deleteBay(req, res) {
    try {
      await bayService.deleteBay(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete bay",
      });
    }
  }
}

module.exports = new BayController();

