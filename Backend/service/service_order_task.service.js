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
const notificationService = require("./notification.service");

const ERROR_CODES = {
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  SERVICE_ORDER_INVALID_STATE: "SERVICE_ORDER_INVALID_STATE",
  SERVICE_TASK_NOT_FOUND: "SERVICE_TASK_NOT_FOUND",
  SERVICE_TASK_INVALID_STATE: "SERVICE_TASK_INVALID_STATE",
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
    serviceOrderId: task.service_order_id._id.toString(),
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
    serviceOrderId: task.service_order_id._id.toString(),
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
    if (task.status !== "in_progress") {
      throw new DomainError(
        "Tác vụ không ở trạng thái 'in_progress'",
        ERROR_CODES.SERVICE_TASK_INVALID_STATE,
        409
      );
    }

    task.status = "completed";
    task.actual_end_time = new Date();
    await task.save();
  }

  async beginTask(task, techniciansInfoArray) {
    if (!["scheduled", "rescheduled"].includes(task.status)) {
      throw new DomainError(
        "Tác vụ không ở trạng thái 'scheduled' hoặc 'rescheduled'",
        ERROR_CODES.SERVICE_TASK_INVALID_STATE,
        409
      );
    }

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

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });

    await inspectionTask.populate("service_order_id");
    return mapInspectionTask(inspectionTask);
  }

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
    )
      .populate("booking_id")
      .exec();

    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    await this.beginTask(inspectionTask, techniciansInfoArray);

    const booking = await Booking.findById(serviceOrder.booking_id).exec();
    if (booking) {
      booking.status = "in_progress";
      await booking.save();
    }

    // Gửi notification cho customer khi bắt đầu kiểm tra
    if (serviceOrder.booking_id?.customer_clerk_id) {
      const plate = serviceOrder.booking_id?.vehicle_id?.license_plate || "xe của bạn";
      await notificationService.createNotification({
        recipientClerkId: serviceOrder.booking_id.customer_clerk_id,
        recipientType: "customer",
        type: "INSPECTION_STARTED",
        title: "Đã bắt đầu kiểm tra xe",
        message: `Xe ${plate} của quý khách đã bắt đầu được kiểm tra. Bấm vào đây để theo dõi tiến độ.`,
        linkTo: `/booking/${serviceOrder.booking_id._id}`,
      });
    }

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

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });

    return mapInspectionTask(inspectionTask);
  }

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

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });

    return mapServicingTask(servicingTask);
  }

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

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });

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

    const booking = await Booking.findById(serviceOrder.booking_id).exec();
    if (booking) {
      booking.status = "completed";
      await booking.save();
    }

    await this.completeTask(servicingTask);

    serviceOrder.status = "completed";
    serviceOrder.completed_at = servicingTask.actual_end_time;
    await serviceOrder.save();

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });

    await InvoiceService.ensureInvoiceForServiceOrder(serviceOrder._id);
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

  async rescheduleTask(taskId, bayId, start, end) {
    let task = await BaySchedulingService.rescheduleTask(
      taskId,
      bayId,
      start,
      end
    );

    task = await ServiceOrderTask.findById(taskId)
      .populate({
        path: "service_order_id",
        populate: { path: "booking_id", populate: { path: "vehicle_id" } },
      })
      .exec();

    // Gửi notification cho customer khi dời lịch
    if (task?.service_order_id?.booking_id?.customer_clerk_id) {
      const booking = task.service_order_id.booking_id;
      const plate = booking.vehicle_id?.license_plate || "xe của bạn";
      const taskType = task.__t === "inspection" ? "kiểm tra" : "sửa chữa";
      const formattedStart = new Date(start).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const formattedEnd = new Date(end).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      await notificationService.createNotification({
        recipientClerkId: booking.customer_clerk_id,
        recipientType: "customer",
        type: "TASK_RESCHEDULED",
        title: `Lịch ${taskType} đã được dời`,
        message: `Lịch ${taskType} cho xe ${plate} đã được dời lại. Thời gian mới: ${formattedStart} - ${formattedEnd}. Bấm vào đây để xem chi tiết.`,
        linkTo: `/booking/${booking._id}`,
      });
    }

    if (task.__t === "inspection") {
      return mapInspectionTask(task);
    } else if (task.__t === "servicing") {
      return mapServicingTask(task);
    }
  }
}

module.exports = new ServiceOrderTaskService();
