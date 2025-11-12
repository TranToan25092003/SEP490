const {
  Booking,
  ServiceOrder,
  InspectionTask,
  ServicingTask,
  ServiceOrderTask,
} = require("../model");
const DomainError = require("../errors/domainError");
const { BaySchedulingService } = require("./bay_scheduling.service");
const { MediaAssetService } = require("./media_asset.service");
const { InvoiceService } = require("./invoice.service");

const ERROR_CODES = {
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  SERVICE_ORDER_INVALID_STATE: "SERVICE_ORDER_INVALID_STATE",
  SERVICE_TASK_NOT_FOUND: "SERVICE_TASK_NOT_FOUND",
};

function mapTimelineEntry(entry) {
  return {
    id: entry._id.toString(),
    title: entry.title,
    comment: entry.comment,
    media: entry.media,
    timestamp: entry.timestamp.toISOString(),
  };
}

function mapTechnicianInfo(techInfo) {
  return {
    technicianClerkId: techInfo.technician_clerk_id,
    role: techInfo.role,
  };
}

function mapServicingTask(task) {
  return {
    id: task._id.toString(),
    type: task.__t,
    serviceOrderId: task.service_order_id.toString(),
    serviceOrderStatus: task.service_order_id.status,
    expectedStartTime: task.expected_start_time.toISOString(),
    expectedEndTime: task.expected_end_time.toISOString(),
    actualStartTime: task.actual_start_time
      ? task.actual_start_time.toISOString()
      : null,
    actualEndTime: task.actual_end_time
      ? task.actual_end_time.toISOString()
      : null,
    status: task.status,
    assignedTechnicians: task.assigned_technicians.map(mapTechnicianInfo),
    assignedBayId: task.assigned_bay_id.toString(),
    timeline: task.timeline.map(mapTimelineEntry).reverse(),
  };
}

function mapInspectionTask(task) {
  return {
    id: task._id.toString(),
    type: task.__t,
    serviceOrderId: task.service_order_id.toString(),
    serviceOrderStatus: task.service_order_id.status,
    expectedStartTime: task.expected_start_time.toISOString(),
    expectedEndTime: task.expected_end_time.toISOString(),
    actualStartTime: task.actual_start_time
      ? task.actual_start_time.toISOString()
      : null,
    actualEndTime: task.actual_end_time
      ? task.actual_end_time.toISOString()
      : null,
    status: task.status,
    assignedTechnicians: task.assigned_technicians.map(mapTechnicianInfo),
    assignedBayId: task.assigned_bay_id.toString(),
    media: task.media,
    comment: task.comment,
  };
}

class ServiceOrderTaskService {
  async completeTask(task) {
    task.status = "completed";
    task.actual_end_time = new Date();
    await task.save();
  }

  /**
   * Function to transition state consistently
   * @param {ServiceOrderTask} task
   * @param {import("./types").TechnicianInfo[]} techniciansInfoArray
   */
  async beginTask(task, techniciansInfoArray) {
    task.assigned_technicians = techniciansInfoArray.map((ti) => ({
      technician_clerk_id: ti.technicianClerkId,
      role: ti.role,
    }));
    task.status = "in_progress";
    task.actual_start_time = new Date();
    await task.save();
  }

  async getTaskDetails(taskId) {
    const task = await ServiceOrderTask.findById(taskId)
      .populate("service_order_id")
      .populate("media", "publicId url kind")
      .populate("timeline.media", "publicId url kind")
      .exec();

    if (task.__t === "inspection") {
      return mapInspectionTask(task);
    } else if (task.__t === "servicing") {
      return mapServicingTask(task);
    }
  }

  async getAllTasksForServiceOrder(serviceOrderId) {
    const tasks = await ServiceOrderTask.find({
      service_order_id: serviceOrderId,
    })

      .populate("media", "publicId url kind")
      .populate("timeline.media", "publicId url kind")
      .populate("service_order_id")
      .exec();

    return tasks
      .map((task) => {
        if (task.__t === "inspection") {
          return mapInspectionTask(task);
        } else if (task.__t === "servicing") {
          return mapServicingTask(task);
        } else {
          return null;
        }
      })
      .filter((t) => t !== null);
  }

  async getOngoingTasksForBayId(bayId) {
    const tasks = await ServiceOrderTask.find({
      assigned_bay_id: bayId,
      status: { $in: ["scheduled", "in_progress"] },
    }).exec();
    return tasks;
  }

  /**
   * Schedule inspection for a service order by creating an inspection task
   * @param {string} serviceOrderId
   * @param {string} bayId
   * @param {Date} start
   * @param {Date} end
   * @returns {Promise<{ serviceOrder: ServiceOrder, inspectionTask: InspectionTask }>}
   */
  async scheduleInspection(serviceOrderId, bayId, start, end) {
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
      start,
      end,
      bayId
    );

    serviceOrder.status = "waiting_inspection";
    await serviceOrder.save();

    return mapInspectionTask(inspectionTask);
  }

  /**
   * Start the inspection task
   * @param {string} taskId
   * @param {import("./types").TechnicianInfo[]} techniciansInfoArray
   * @returns {Promise<{ serviceOrder: ServiceOrder, inspectionTask: InspectionTask }>}task
   */
  async beginInspectionTask(taskId, techniciansInfoArray) {
    const inspectionTask = await InspectionTask.findById(taskId).exec();
    if (!inspectionTask) {
      throw new DomainError(
        "Tác vụ kiểm tra không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(
      inspectionTask.service_order_id
    ).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    await this.beginTask(inspectionTask, techniciansInfoArray);

    serviceOrder.status = "waiting_inspection";
    await serviceOrder.save();

    return mapInspectionTask(inspectionTask);
  }

  async updateInspection(taskId, payload) {
    const inspectionTask = await InspectionTask.findById(taskId).exec();
    if (!inspectionTask) {
      throw new DomainError(
        "Tác vụ kiểm tra không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const assetIds = await MediaAssetService.saveMediaAsset(payload.media);
    console.log("Saved media asset IDs:", assetIds);

    inspectionTask.comment = payload.comment;
    inspectionTask.media = assetIds;

    await inspectionTask.save();

    return mapInspectionTask(inspectionTask);
  }

  async completeInspection(taskId, payload) {
    const inspectionTask = await InspectionTask.findById(taskId).exec();
    if (!inspectionTask) {
      throw new DomainError(
        "Tác vụ kiểm tra không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(
      inspectionTask.service_order_id
    ).exec();
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

    return mapInspectionTask(inspectionTask);
  }

  /**
   * Schedule servicing for a service order by creating a servicing task
   * and moving order status to 'scheduled'.
   * @param {string} serviceOrderId
   * @param {string} bayId
   * @param {Date} start
   * @param {Date} end
   *
   * @returns {Promise<{ serviceOrder: ServiceOrder, servicingTask: ServicingTask }>}
   */
  async scheduleService(serviceOrderId, bayId, start, end) {
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
      start,
      end,
      bayId
    );

    serviceOrder.status = "scheduled";
    await serviceOrder.save();

    return mapServicingTask(servicingTask);
  }

  /**
   * Start the servicing task for the order, moving to 'servicing'.
   * @param {string} taskId
   * @param {import("./types").TechnicianInfo[]} techniciansInfoArray
   * @return {Promise<ServiceOrder>}
   *
   * @returns {Promise<{ serviceOrder: ServiceOrder, servicingTask: ServicingTask }>}
   */
  async startService(taskId, techniciansInfoArray) {
    const servicingTask = await ServicingTask.findById(taskId).exec();
    if (!servicingTask) {
      throw new DomainError(
        "Tác vụ dịch vụ không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(
      servicingTask.service_order_id
    ).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    await this.beginTask(servicingTask, techniciansInfoArray);

    serviceOrder.status = "servicing";
    await serviceOrder.save();

    return mapServicingTask(servicingTask);
  }

  async completeService(taskId) {
    const servicingTask = await ServicingTask.findById(taskId).exec();
    if (!servicingTask) {
      throw new DomainError(
        "Tác vụ dịch vụ không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(
      servicingTask.service_order_id
    ).exec();
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

    await InvoiceService.ensureInvoiceForServiceOrder(serviceOrder._id);

    if (serviceOrder.booking_id) {
      await Booking.updateOne(
        { _id: serviceOrder.booking_id },
        { status: "completed" }
      ).exec();
    }

    return mapServicingTask(servicingTask);
  }

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
      media: assetIds,
    };

    servicingTask.timeline.push(timelineEntry);
    await servicingTask.save();

    return mapServicingTask(servicingTask);
  }

  async getServiceTaskTimelineEntry(taskId, entryId) {
    const servicingTask = await ServicingTask.findById(taskId)
      .populate("timeline.media")
      .exec();
    if (!servicingTask) return null;
    const timelineEntry = await servicingTask.timeline.id(entryId);

    return timelineEntry ? mapTimelineEntry(timelineEntry) : null;
  }

  async updateServiceTaskTimelineEntry(taskId, entryId, entry) {
    const servicingTask = await ServicingTask.findById(taskId).exec();
    if (!servicingTask) {
      throw new DomainError(
        "Tác vụ dịch vụ không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const timelineEntry = servicingTask.timeline.id(entryId);
    if (!timelineEntry) {
      throw new DomainError(
        "Mục dòng thời gian không tồn tại",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const assetIds = await MediaAssetService.saveMediaAsset(entry.media);

    timelineEntry.title = entry.title;
    timelineEntry.comment = entry.comment;
    timelineEntry.media = assetIds;

    await servicingTask.save();

    return mapServicingTask(servicingTask);
  }
}

module.exports = new ServiceOrderTaskService();
