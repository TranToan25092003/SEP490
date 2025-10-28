const serviceOrderService = require("../../service/service_order.service");

class ServiceOrderController {
  async getAllServiceOrders(req, res, next) {
    try {
      const serviceOrders = await serviceOrderService.getAllServiceOrdersByCreatedDateAscending();

      res.status(200).json({
        data: serviceOrders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceOrderById(req, res, next) {
    try {
      const serviceOrderId = req.params.id;
      const serviceOrder = await serviceOrderService.getServiceOrderById(serviceOrderId);
      if (!serviceOrder) {
        return res.status(404).json({ message: "Service order not found" });
      }

      res.status(200).json({
        data: serviceOrder
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceOrderController();
