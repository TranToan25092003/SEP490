const serviceOrderService = require("../service/service_order.service");

class ServiceOrderController {
  async createWalkInServiceOrder(req, res, next) {
    try {
      const staffId = req.userId;
      const {
        customerName,
        customerPhone,
        customerAddress,
        licensePlate,
        serviceIds,
        note,
        vehicleModel,
        vehicleColor,
      } = req.body;

      const serviceOrder = await serviceOrderService.createWalkInServiceOrder({
        staffId,
        customer: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
        vehicle: {
          licensePlate,
          model: vehicleModel,
          color: vehicleColor,
        },
        serviceIds,
        note,
      });

      res.status(201).json({
        message: "Tạo lệnh sửa chữa thành công",
        data: serviceOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllServiceOrders(req, res, next) {
    try {
      const {
        page,
        limit,
        customerName,
        status,
        startTimestamp,
        endTimestamp,
      } = req.query;
      const serviceOrders =
        await serviceOrderService.getAllServiceOrdersByCreatedDateDescending({
          page: parseInt(page, 10) || 1,
          limit: parseInt(limit, 10) || 20,
          customerName: customerName || null,
          status: status || null,
          startTimestamp: startTimestamp ? parseInt(startTimestamp, 10) : null,
          endTimestamp: endTimestamp ? parseInt(endTimestamp, 10) : null,
        });

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
      const serviceOrder = await serviceOrderService.getServiceOrderById(
        serviceOrderId
      );
      if (!serviceOrder) {
        return res.status(404).json({ message: "Service order not found" });
      }

      res.status(200).json({
        data: serviceOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateServiceOrderItems(req, res, next) {
    try {
      const serviceOrderId = req.params.id;
      const items = req.body.items;

      await serviceOrderService.updateServiceOrderItems(serviceOrderId, items);

      res.status(200).json({
        message: "Service order items updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelServiceOrder(req, res, next) {
    try {
      const serviceOrderId = req.params.id;
      const staffId = req.userId;
      const { cancelReason } = req.body;

      const serviceOrder = await serviceOrderService.cancelServiceOrder(
        serviceOrderId,
        staffId,
        cancelReason
      );

      res.status(200).json({
        message: "Hủy lệnh sửa chữa thành công",
        data: serviceOrder,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceOrderController();
