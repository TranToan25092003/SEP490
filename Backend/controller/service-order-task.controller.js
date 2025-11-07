const serviceOrderTaskService = require("../service/service_order_task.service");

class ServiceOrderTaskController {
  async scheduleInspection(req, res, next) {
    try {
      const { serviceOrderId } = req.params;
      const { bayId, start, end } = req.body;

      const result = await serviceOrderTaskService.scheduleInspection(
        serviceOrderId,
        bayId,
        new Date(start),
        new Date(end)
      );

      res.status(200).json({
        data: result,
        message: "Inspection scheduled successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskDetails(req, res, next) {
    try {
      const { taskId } = req.params;

      const result = await serviceOrderTaskService.getTaskDetails(taskId);

      res.status(200).json({
        data: result,
        message: "Task details retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTasksForServiceOrder(req, res, next) {
    try {
      const { serviceOrderId } = req.params;

      const result = await serviceOrderTaskService.getAllTasksForServiceOrder(serviceOrderId);

      res.status(200).json({
        data: result,
        message: "All tasks for service order retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async beginInspectionTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { technicians } = req.body;

      const result = await serviceOrderTaskService.beginInspectionTask(taskId, technicians);

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
      const { comment, media } = req.body;

      const result = await serviceOrderTaskService.completeInspection(taskId, {
        comment,
        media,
      });

      res.status(200).json({
        data: result,
        message: "Inspection completed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInspection(req, res, next) {
    try {
      const { taskId } = req.params;
      const { comment, media } = req.body;

      const result = await serviceOrderTaskService.updateInspection(taskId, {
        comment,
        media
      });

      res.status(200).json({
        data: result,
        message: "Inspection updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async scheduleService(req, res, next) {
    try {
      const { serviceOrderId } = req.params;
      const { bayId, start, end } = req.body;

      const result = await serviceOrderTaskService.scheduleService(
        serviceOrderId,
        bayId,
        new Date(start),
        new Date(end)
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
      const { technicians } = req.body;

      const result = await serviceOrderTaskService.startService(taskId, technicians);

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
      const { title, comment, media } = req.body;

      const result = await serviceOrderTaskService.updateServiceTaskTimeline(
        taskId,
        {
          title,
          comment,
          media
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

  async getServiceTaskTimelineEntry(req, res, next) {
    try {
      const { taskId, entryId } = req.params;

      const result = await serviceOrderTaskService.getServiceTaskTimelineEntry(
        taskId,
        entryId
      );

      if (!result) {
        return res.status(404).json({
          message: "Service task timeline entry not found",
        });
      }

      res.status(200).json({
        data: result,
        message: "Service task timeline entry retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateServiceTaskTimelineEntry(req, res, next) {
    try {
      const { taskId, entryId } = req.params;
      const { title, comment, media } = req.body;

      const result = await serviceOrderTaskService.updateServiceTaskTimelineEntry(
        taskId,
        entryId,
        {
          title,
          comment,
          media
        }
      );

      res.status(200).json({
        data: result,
        message: "Service task timeline entry updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceOrderTaskController();
