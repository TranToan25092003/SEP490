const { ServiceOrder, ServiceOrderItem, Service, Booking, InspectionTask, ServicingTask } = require("../model");
const { ServicesService, ERROR_CODES: SERVICE_ERROR_CODES } = require("./services.service");
const DomainError = require("../errors/domainError");
const { BaySchedulingService } = require("./bay_scheduling.service");

const ERROR_CODES = {
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  SERVICE_ORDER_ALREADY_EXISTS: "SERVICE_ORDER_ALREADY_EXISTS",
  SERVICE_ORDER_INVALID_STATE: "SERVICE_ORDER_INVALID_STATE",
  SERVICE_TASK_NOT_FOUND: "SERVICE_TASK_NOT_FOUND",
};

class ServiceOrderService {
  async _createServiceOrderFromBooking(staffId, bookingId) {
    const existingOrder = await ServiceOrder.findOne({ booking_id: bookingId }).exec();
    if (existingOrder) {
      throw new DomainError(
        "Lệnh đã tồn tại cho booking này",
        ERROR_CODES.SERVICE_ORDER_ALREADY_EXISTS,
        409
      );
    }

    const booking = await Booking.findById(bookingId).exec();

    //clone to lock in price
    const items = await this.convertServiceIdsToServiceItems(booking.service_ids);

    const serviceOrder = new ServiceOrder({
      staff_clerk_id: staffId,
      booking_id: booking._id,
      items: items,
    });

    await serviceOrder.save();

    booking.status = "in_progress";
    booking.service_order_id = serviceOrder._id;
    await booking.save();
  }

  /**
   * Begin the inspection process for a service order by scheduling an inspection task
   * @param {string} serviceOrderId
   * @param {{
   *  technicianClerkId: string,
   *  role: "lead" | "assistant"
   * }[]} techniciansInfo
   * @param {*} expectedDurationInMinutes
   * @returns {Promise<serviceOrder>}
   */
  async beginInspection(serviceOrderId, techniciansInfo, expectedDurationInMinutes) {
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

    await BaySchedulingService.scheduleInspectionTask(
      serviceOrderId,
      expectedDurationInMinutes,
      techniciansInfo
    );

    serviceOrder.status = "waiting_inspection";
    await serviceOrder.save();

    return serviceOrder;
  }

  /**
   * Complete the inspection task for a service order.
   * - Marks the active inspection task as completed with comment/photos
   * - Moves order status to 'inspection_completed'
   * @param {string} serviceOrderId
   * @param {{ comment: string, photoUrls: string[] }} payload
   */
  async completeInspection(serviceOrderId, payload) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (serviceOrder.status !== "waiting_inspection") {
      throw new DomainError(
        "Chỉ có thể hoàn tất kiểm tra khi lệnh ở trạng thái 'waiting_inspection'",
        ERROR_CODES.SERVICE_ORDER_INVALID_STATE,
        409
      );
    }

    const inspectionTask = await InspectionTask.findOne({
      service_order_id: serviceOrderId,
      actual_end_time: null,
    })
      .sort({ expected_start_time: -1 })
      .exec();

    if (!inspectionTask) {
      throw new DomainError(
        "Không tìm thấy tác vụ kiểm tra đang hoạt động",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    inspectionTask.actual_start_time = inspectionTask.actual_start_time || new Date();
    inspectionTask.actual_end_time = new Date();
    inspectionTask.comment = payload.comment;
    inspectionTask.photoUrls = payload.photoUrls;
    await inspectionTask.save();

    serviceOrder.status = "inspection_completed";
    await serviceOrder.save();

    return { serviceOrder, inspectionTask };
  }

  /**
   * Schedule servicing for a service order by creating a servicing task
   * and moving order status to 'scheduled'.
   * @param {string} serviceOrderId
   * @param {{ technicianClerkId: string, role: "lead" | "assistant" }[]} techniciansInfo
   * @param {number} expectedDurationInMinutes
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
   * @param {string} serviceOrderId
   * @return {Promise<ServiceOrder>}
   */
  async startService(serviceOrderId) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (serviceOrder.status !== "scheduled") {
      throw new DomainError(
        "Chỉ có thể bắt đầu dịch vụ khi lệnh ở trạng thái 'scheduled'",
        ERROR_CODES.SERVICE_ORDER_INVALID_STATE,
        409
      );
    }

    const servicingTask = await ServicingTask.findOne({
      service_order_id: serviceOrderId,
      actual_end_time: null,
    })
      .sort({ expected_start_time: 1 })
      .exec();

    if (!servicingTask) {
      throw new DomainError(
        "Không tìm thấy tác vụ dịch vụ để bắt đầu",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    servicingTask.actual_start_time = servicingTask.actual_start_time || new Date();
    await servicingTask.save();

    serviceOrder.status = "servicing";
    await serviceOrder.save();

    return serviceOrder;
  }

  /**
   * Complete the servicing task and mark the order completed.
   * @param {string} serviceOrderId
   * @return {Promise<ServiceOrder>}
   */
  async completeService(serviceOrderId) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (!["servicing"].includes(serviceOrder.status)) {
      throw new DomainError(
        "Chỉ có thể hoàn tất khi lệnh đang được thực hiện",
        ERROR_CODES.SERVICE_ORDER_INVALID_STATE,
        409
      );
    }

    const servicingTask = await ServicingTask.findOne({
      service_order_id: serviceOrderId,
      actual_end_time: null,
    })
      .sort({ expected_start_time: -1 })
      .exec();

    if (!servicingTask) {
      throw new DomainError(
        "Không tìm thấy tác vụ dịch vụ đang hoạt động",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    servicingTask.actual_end_time = new Date();
    await servicingTask.save();

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
   * @param {string} serviceOrderId
   * @param {{ title: string, comment: string, photoUrls?: string[] }} entry
   */
  async updateServiceTimeline(serviceOrderId, entry) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    const servicingTask = await ServicingTask.findOne({
      service_order_id: serviceOrderId,
      actual_end_time: null,
    })
      .sort({ expected_start_time: -1 })
      .exec();

    if (!servicingTask) {
      throw new DomainError(
        "Không tìm thấy tác vụ dịch vụ đang hoạt động để cập nhật timeline",
        ERROR_CODES.SERVICE_TASK_NOT_FOUND,
        404
      );
    }

    const timelineEntry = {
      title: entry.title,
      comment: entry.comment,
      photoUrls: entry.photoUrls || [],
    };

    servicingTask.timeline = servicingTask.timeline || [];
    servicingTask.timeline.push(timelineEntry);
    await servicingTask.save();

    return { serviceOrder, servicingTask };
  }

  async convertServiceIdsToServiceItems(serviceIds) {
    const nonDuplicateServiceIds = [...new Set(serviceIds.map(String))];
    const validServiceIds = await ServicesService.getValidServiceIds(nonDuplicateServiceIds);

    if (validServiceIds.length !== nonDuplicateServiceIds.length) {
      throw new DomainError(
        "Một hoặc nhiều dịch vụ không hợp lệ",
        SERVICE_ERROR_CODES.SERVICE_NOT_FOUND,
        404
      );
    }

    const services = await Service.find({ _id: { $in: validServiceIds } }).exec();
    return services.map((service) => new ServiceOrderItem({
      price: service.base_price,
      quantity: 1,
      service_id: service._id,
    }));
  }
}

module.exports = new ServiceOrderService();
