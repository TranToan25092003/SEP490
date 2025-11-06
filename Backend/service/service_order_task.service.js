const { Booking, ServiceOrder, InspectionTask, ServicingTask, ServiceOrderTask } = require("../model");
const DomainError = require("../errors/domainError");
const { BaySchedulingService } = require("./bay_scheduling.service");
const { MediaAssetService } = require("./media_asset.service");

const ERROR_CODES = {
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  SERVICE_ORDER_INVALID_STATE: "SERVICE_ORDER_INVALID_STATE",
  SERVICE_TASK_NOT_FOUND: "SERVICE_TASK_NOT_FOUND",
};

class ServiceOrderTaskService {
  /**
   * Function to transition state consistently
   */
  async completeTask(task) {
    task.status = "completed";
    task.actual_end_time = new Date();
    await task.save();
  }

  /**
   * Function to transition state consistently
   */
  async beginTask(task) {
    task.status = "in_progress";
    task.actual_start_time = new Date();
    await task.save();
  }

  async getTaskDetails(taskId) {
    const task = await ServiceOrderTask.findById(taskId);
    return task;
  }

  async getAllTasksForServiceOrder(serviceOrderId) {
    const tasks = await ServiceOrderTask.find({
      service_order_id: serviceOrderId,
    })
      .populate("media", "publicId url kind")
      .exec();
    return tasks;
  }

  /**
   * Schedule inspection for a service order by creating an inspection task
   * @param {string} serviceOrderId
   * @param {import("./types").TechnicianInfo[]} techniciansInfoArray
   * @param {number} expectedDurationInMinutes
   * @returns {Promise<{ serviceOrder: ServiceOrder, inspectionTask: InspectionTask }>}
   */
  async scheduleInspection(serviceOrderId, techniciansInfoArray, expectedDurationInMinutes) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (serviceOrder.status !== "created") {
      throw new DomainError(
        "Lệnh không ở trạng thái 'created'",
        ERROR_CODES.SERVICE_ORDER_INVALID_STATE,
        409
      );
    }

    const inspectionTask = await BaySchedulingService.scheduleInspectionTask(
      serviceOrderId,
      expectedDurationInMinutes,
      techniciansInfoArray
    );

    serviceOrder.status = "waiting_inspection";
    await serviceOrder.save();

    return { serviceOrder, inspectionTask };
  }

  /**
   * Start the inspection task
   * @param {string} taskId
   * @returns {Promise<{ serviceOrder: ServiceOrder, inspectionTask: InspectionTask }>}task
   */
  async beginInspectionTask(taskId) {
    const inspectionTask = await InspectionTask.findById(taskId).exec();
    if (!inspectionTask) {
      throw new DomainError(
        "Tác vụ kiểm tra không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(inspectionTask.service_order_id).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    await this.beginTask(inspectionTask);

    serviceOrder.status = "waiting_inspection";
    await serviceOrder.save();

    return { serviceOrder, inspectionTask };
  }

  /**
   * Complete the inspection task for a service order.
   * - Marks the active inspection task as completed with comment/photos
   * - Moves order status to 'inspection_completed'
   * @param {string} taskId
   * @param {import("./types").CompleteInspectionPayload} payload
   * @returns {Promise<{ serviceOrder: ServiceOrder, inspectionTask: InspectionTask }>}
   */
  async completeInspection(taskId, payload) {
    const inspectionTask = await InspectionTask.findById(taskId).exec();
    if (!inspectionTask) {
      throw new DomainError(
        "Tác vụ kiểm tra không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(inspectionTask.service_order_id).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    const assetIds = await MediaAssetService.saveMediaAsset(payload.media);
    console.log("Saved media asset IDs:", assetIds);

    inspectionTask.comment = payload.comment;
    inspectionTask.media = assetIds;

    await this.completeTask(inspectionTask);

    serviceOrder.status = "inspection_completed";
    await serviceOrder.save();

    return { serviceOrder, inspectionTask };
  }

  /**
   * Schedule servicing for a service order by creating a servicing task
   * and moving order status to 'scheduled'.
   * @param {string} serviceOrderId
   * @param {import("./types").TechnicianInfo[]} techniciansInfo
   * @param {number} expectedDurationInMinutes
   *
   * @returns {Promise<{ serviceOrder: ServiceOrder, servicingTask: ServicingTask }>}
   */
  async scheduleService(serviceOrderId, techniciansInfo, expectedDurationInMinutes) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (!["inspection_completed", "approved"].includes(serviceOrder.status)) {
      throw new DomainError(
        "Lệnh phải ở trạng thái 'inspection_completed' hoặc 'approved' để lên lịch dịch vụ",
        ERROR_CODES.SERVICE_ORDER_INVALID_STATE,
        409
      );
    }

    const servicingTask = await BaySchedulingService.scheduleServicingTask(
      serviceOrderId,
      expectedDurationInMinutes,
      techniciansInfo
    );

    serviceOrder.status = "scheduled";
    await serviceOrder.save();

    return { serviceOrder, servicingTask };
  }

  /**
   * Start the servicing task for the order, moving to 'servicing'.
   * @param {string} taskId
   * @return {Promise<ServiceOrder>}
   *
   * @returns {Promise<{ serviceOrder: ServiceOrder, servicingTask: ServicingTask }>}
   */
  async startService(taskId) {
    const servicingTask = await ServicingTask.findById(taskId).exec();
    if (!servicingTask) {
      throw new DomainError(
        "Tác vụ dịch vụ không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(servicingTask.service_order_id).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    await this.beginTask(servicingTask);

    serviceOrder.status = "servicing";
    await serviceOrder.save();
    return { serviceOrder, servicingTask };
  }

  /**
   * Complete the servicing task and mark the order completed.
   * @param {string} taskId
   * @return {Promise<{ serviceOrder: ServiceOrder, servicingTask: ServicingTask }>}
   */
  async completeService(taskId) {
    const servicingTask = await ServicingTask.findById(taskId).exec();
    if (!servicingTask) {
      throw new DomainError(
        "Tác vụ dịch vụ không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(servicingTask.service_order_id).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    await this.completeTask(servicingTask);

    serviceOrder.status = "completed";
    serviceOrder.completed_at = servicingTask.actual_end_time;
    await serviceOrder.save();

    if (serviceOrder.booking_id) {
      await Booking.updateOne({ _id: serviceOrder.booking_id }, { status: "completed" }).exec();
    }

    return serviceOrder;
  }

  /**
   * Append a timeline entry for the servicing task.
   * @param {string} taskId
   * @param {import("./types").ServiceTimelineEntry} entry
   * @return {Promise<ServicingTask>}
   */
  async updateServiceTaskTimeline(taskId, entry) {
    const servicingTask = await ServicingTask.findById(taskId).exec();
    if (!servicingTask) {
      throw new DomainError(
        "Tác vụ dịch vụ không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const assetIds = await MediaAssetService.saveMediaAsset(entry.media);

    const timelineEntry = {
      title: entry.title,
      comment: entry.comment,
      media: assetIds
    };

    servicingTask.timeline.push(timelineEntry);
    await servicingTask.save();

    return servicingTask;
  }
}

module.exports = new ServiceOrderTaskService();
