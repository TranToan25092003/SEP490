const serviceOrderTaskService = require("../service/service_order_task.service");

class ServiceOrderTaskController {
  async scheduleInspection(req, res, next) {
    try {
      const { serviceOrderId } = req.params;
      const { technicians, expectedDurationInMinutes } = req.body;

      const result = await serviceOrderTaskService.scheduleInspection(
        serviceOrderId,
        technicians,
        expectedDurationInMinutes
      );

      res.status(200).json({
        data: result,
        message: "Inspection scheduled successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async beginInspectionTask(req, res, next) {
    try {
      const { taskId } = req.params;

      const result = await serviceOrderTaskService.beginInspectionTask(taskId);

      res.status(200).json({
        data: result,
        message: "Inspection task started successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async completeInspection(req, res, next) {
    try {
      const { taskId } = req.params;
      const { comment, photoUrls } = req.body;

      const result = await serviceOrderTaskService.completeInspection(taskId, {
        comment,
        photoUrls,
      });

      res.status(200).json({
        data: result,
        message: "Inspection completed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async scheduleService(req, res, next) {
    try {
      const { serviceOrderId } = req.params;
      const { technicians, expectedDurationInMinutes } = req.body;

      const result = await serviceOrderTaskService.scheduleService(
        serviceOrderId,
        technicians,
        expectedDurationInMinutes
      );

      res.status(200).json({
        data: result,
        message: "Service scheduled successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async startService(req, res, next) {
    try {
      const { taskId } = req.params;

      const result = await serviceOrderTaskService.startService(taskId);

      res.status(200).json({
        data: result,
        message: "Service started successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async completeService(req, res, next) {
    try {
      const { taskId } = req.params;

      const result = await serviceOrderTaskService.completeService(taskId);

      res.status(200).json({
        data: result,
        message: "Service completed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateServiceTaskTimeline(req, res, next) {
    try {
      const { taskId } = req.params;
      const { title, comment, photoUrls } = req.body;

      const result = await serviceOrderTaskService.updateServiceTaskTimeline(
        taskId,
        {
          title,
          comment,
          photoUrls,
        }
      );

      res.status(200).json({
        data: result,
        message: "Service task timeline updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceOrderTaskController();
