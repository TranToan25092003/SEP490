const ServicesService = require("../service/services.service");

class ServicesController {
  async getAllServices(req, res, next) {
    try {
      const services = await ServicesService.getAllServices();
      res.json({
        data: services,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ServicesController();
