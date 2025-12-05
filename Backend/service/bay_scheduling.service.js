const {
  Bay,
  ServiceOrderTask,
  InspectionTask,
  ServicingTask,
} = require("../model");
const DomainError = require("../errors/domainError");
const serviceConfig = require("./config");

const ERROR_CODES = {
  BAYS_UNAVAILABLE: "BAYS_UNAVAILABLE",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
};

class BaySchedulingService {
  async rescheduleTask(taskId, bayId, newStart, newEnd) {
    const task = await ServiceOrderTask.findById(taskId)
      .populate("service_order_id")
      .exec();
    if (!task) {
      throw new DomainError("Task not found", ERROR_CODES.TASK_NOT_FOUND);
    }

    const overlappingTasks = await this.findOverlappingTasksForBayId(
      bayId,
      newStart,
      newEnd,
      [taskId]
    );

    if (overlappingTasks.length > 0) {
      throw new DomainError(
        "The selected bay is not available for the requested time slot.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    if (
      newEnd.getHours() > serviceConfig.BUSINESS_END_HOUR ||
      newStart.getHours() < serviceConfig.BUSINESS_START_HOUR
    ) {
      throw new DomainError(
        "The requested time slot is outside business hours.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    task.expected_start_time = newStart;
    task.expected_end_time = newEnd;
    task.assigned_bay_id = bayId;
    // Đặt lại trạng thái thành 'rescheduled' để thể hiện đang chờ tới lịch mới
    task.status = "rescheduled";

    // Nếu là tác vụ sửa chữa, ghi nhận thêm một mốc trong timeline để khách/staff
    // nhìn thấy rõ việc dời lịch ngay trong tiến độ
    if (task.__t === "servicing") {
      const startText = newStart.toLocaleString("vi-VN");
      const endText = newEnd.toLocaleString("vi-VN");

      task.timeline.push({
        title: "Dời lịch sửa chữa",
        comment: `Dời lịch sửa chữa sang khung giờ ${startText} - ${endText}`,
        timestamp: new Date(),
        media: [],
      });

      // Nếu có service_order_id thì cập nhật luôn trạng thái lệnh sang 'rescheduled'
      if (task.service_order_id) {
        task.service_order_id.status = "rescheduled";
        await task.service_order_id.save();
      }
    }

    await task.save();

    return task;
  }

  async scheduleInspectionTask(serviceOrderId, start, end, bayId) {
    const overlappingTasks = await this.findOverlappingTasksForBayId(
      bayId,
      start,
      end
    );
    if (overlappingTasks.length > 0) {
      throw new DomainError(
        "The selected bay is not available for the requested time slot.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    if (
      end.getHours() > serviceConfig.BUSINESS_END_HOUR ||
      start.getHours() < serviceConfig.BUSINESS_START_HOUR
    ) {
      throw new DomainError(
        "The requested time slot is outside business hours.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    const inspectionTask = new InspectionTask({
      service_order_id: serviceOrderId,
      expected_start_time: start,
      expected_end_time: end,
      actual_start_time: null,
      actual_end_time: null,
      assigned_technicians: [],
      assigned_bay_id: bayId,
    });

    await inspectionTask.save();

    return inspectionTask;
  }

  async scheduleServicingTask(serviceOrderId, start, end, bayId) {
    const overlappingTasks = await this.findOverlappingTasksForBayId(
      bayId,
      start,
      end
    );
    if (overlappingTasks.length > 0) {
      throw new DomainError(
        "The selected bay is not available for the requested time slot.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    if (
      end.getHours() > serviceConfig.BUSINESS_END_HOUR ||
      start.getHours() < serviceConfig.BUSINESS_START_HOUR
    ) {
      throw new DomainError(
        "The requested time slot is outside business hours.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    const servicingTask = new ServicingTask({
      service_order_id: serviceOrderId,
      expected_start_time: start,
      expected_end_time: end,
      actual_start_time: null,
      actual_end_time: null,
      assigned_technicians: [],
      assigned_bay_id: bayId,
      timeline: [],
    });

    await servicingTask.save();
    return servicingTask;
  }

  async findOverlappingTasksForBayId(bayId, start, end, ignoredTaskIds = []) {
    const conflictingTasks = await ServiceOrderTask.find({
      assigned_bay_id: bayId,
      status: { $ne: "completed" },
      expected_start_time: { $lt: end },
      expected_end_time: { $gt: start },
      _id: { $nin: ignoredTaskIds },
    }).exec();

    return conflictingTasks;
  }

  async findNextNSlotsForBayId(
    bayId,
    n,
    durationInMinutes,
    starting = new Date(),
    ignoredTaskIds = [],
    startOfDayHours = serviceConfig.BUSINESS_START_HOUR,
    endOfDayHours = serviceConfig.BUSINESS_END_HOUR,
    maxCutOffDate = new Date(
      Date.now() +
        (serviceConfig?.DEFAULT_MAX_LOOKAHEAD_MILLISECONDS || 10 * 3_600_000)
    )
  ) {
    const slots = [];
    const now = new Date();

    // Đảm bảo starting không ở quá khứ
    if (!starting || starting < now) {
      starting = new Date(now);
    }

    let startTime = new Date(starting);

    // Clamp starting time to business hours - reset về đầu giờ làm việc
    if (startTime.getHours() < startOfDayHours) {
      startTime.setHours(startOfDayHours, 0, 0, 0);
    } else if (startTime.getHours() >= endOfDayHours) {
      // Nếu đã quá giờ làm việc, chuyển sang ngày hôm sau
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(startOfDayHours, 0, 0, 0);
    } else {
      // Nếu trong giờ làm việc nhưng có phút/giây, làm tròn lên đến phút tiếp theo
      // Để đảm bảo slot bắt đầu từ đầu phút
      if (
        startTime.getMinutes() > 0 ||
        startTime.getSeconds() > 0 ||
        startTime.getMilliseconds() > 0
      ) {
        startTime.setMinutes(startTime.getMinutes() + 1, 0, 0);
      }
    }

    while (slots.length < n && startTime < maxCutOffDate) {
      const startOfNextDay = new Date(startTime);
      startOfNextDay.setDate(startOfNextDay.getDate() + 1);
      startOfNextDay.setHours(startOfDayHours, 0, 0, 0);

      const endOfDay = new Date(startTime);
      endOfDay.setHours(endOfDayHours, 0, 0, 0);

      // Kiểm tra nếu startTime đã vượt quá endOfDay trong ngày hiện tại
      if (startTime >= endOfDay) {
        startTime = startOfNextDay;
        continue;
      }

      const endTime = new Date(
        startTime.getTime() + durationInMinutes * 60_000
      );

      // Kiểm tra nếu slot vượt quá giờ làm việc
      if (endTime > endOfDay) {
        startTime = startOfNextDay;
        continue;
      }

      // Kiểm tra overlap với các task hiện có
      const overlappingTasks = await this.findOverlappingTasksForBayId(
        bayId,
        startTime,
        endTime,
        ignoredTaskIds
      );

      if (overlappingTasks.length === 0) {
        // Slot trống, thêm vào danh sách
        slots.push({
          start: new Date(startTime),
          end: new Date(endTime),
        });
        // Tăng startTime lên một khoảng bằng duration để tìm slot tiếp theo
        startTime = new Date(startTime.getTime() + durationInMinutes * 60_000);
      } else {
        // Có conflict, tìm thời điểm kết thúc muộn nhất của các task đang conflict
        const maxEndTime = overlappingTasks.reduce((max, task) => {
          const taskEnd =
            task.expected_end_time instanceof Date
              ? task.expected_end_time
              : new Date(task.expected_end_time);
          return taskEnd > max ? taskEnd : max;
        }, new Date(startTime));

        // Chuyển startTime đến sau khi task cuối cùng kết thúc
        startTime = new Date(maxEndTime);

        // Đảm bảo startTime không vượt quá endOfDay
        if (startTime >= endOfDay) {
          startTime = startOfNextDay;
        }
      }
    }

    return slots;
  }

  async findNextAvailableSlotGlobally(
    durationInMinutes,
    starting = new Date(),
    maxCutOffDate = new Date(
      Date.now() +
        (serviceConfig?.DEFAULT_MAX_LOOKAHEAD_MILLISECONDS || 10 * 3_600_000)
    )
  ) {
    while (starting < maxCutOffDate) {
      const end = new Date(starting.getTime() + durationInMinutes * 60_000);
      const [availableBays, conflictingTasksMap] = await this.findAvailableBay(
        starting,
        end
      );

      if (availableBays.length > 0) {
        return {
          start: starting,
          end: end,
          candidateBays: availableBays,
        };
      } else {
        // Preprocess: Finding the maximum endtime of conflicting tasks per bay
        const maxEndTimePerBay = [];
        for (const conflictingTasksPerBay of Object.values(
          conflictingTasksMap
        )) {
          let maxEndTime = null;
          for (const task of conflictingTasksPerBay) {
            if (maxEndTime === null || task.expected_end_time > maxEndTime) {
              maxEndTime = task.expected_end_time;
            }
          }
          maxEndTimePerBay.push(maxEndTime);
        }

        // Finding the minimum endtimes across bays
        const nextTime = maxEndTimePerBay.reduce((min, curr) => {
          if (min === null || curr < min) {
            return curr;
          }
          return min;
        }, null);

        //Defensive programming: bump by duration
        if (nextTime === null) {
          starting = new Date(starting.getTime() + durationInMinutes * 60_000);
        } else {
          starting = nextTime;
        }
      }
    }

    return null;
  }

  async findAvailableBayGlobally(expectedStartTime, expectedEndTime) {
    const bays = await Bay.find({});
    const availableBays = [];
    const conflictingTasksMap = {};

    for (const bay of bays) {
      const conflictingTasks = await this.findOverlappingTasksForBayId(
        bay._id,
        expectedStartTime,
        expectedEndTime
      );

      if (conflictingTasks.length === 0) {
        availableBays.push(bay);
      } else {
        conflictingTasksMap[bay._id.toString()] = conflictingTasks;
      }
    }

    return [availableBays, conflictingTasksMap];
  }

  /**
   * Tự động dời lịch task quá hạn theo thứ tự ưu tiên:
   * 1. Slot sau của bay hiện tại còn trống
   * 2. Slot sau của bay khác còn trống
   * 3. Slot xa hơn
   */
  async autoRescheduleOverdueTask(task) {
    const now = new Date();
    const currentEndTime =
      task.expected_end_time instanceof Date
        ? task.expected_end_time
        : new Date(task.expected_end_time);

    // Tính duration từ thời gian dự kiến ban đầu
    const currentStartTime =
      task.expected_start_time instanceof Date
        ? task.expected_start_time
        : new Date(task.expected_start_time);
    const durationInMinutes = Math.round(
      (currentEndTime.getTime() - currentStartTime.getTime()) / (60 * 1000)
    );

    if (durationInMinutes <= 0) {
      console.error(`[AutoReschedule] Invalid duration for task ${task._id}`);
      return null;
    }

    const currentBayId = task.assigned_bay_id;

    // Ưu tiên 1: Tìm slot sau của bay hiện tại (bắt đầu từ expected_end_time hiện tại)
    const nextSlotSameBay = await this.findNextNSlotsForBayId(
      currentBayId,
      1,
      durationInMinutes,
      currentEndTime,
      [task._id.toString()] // Ignore chính task này
    );

    if (nextSlotSameBay.length > 0) {
      const slot = nextSlotSameBay[0];
      console.log(
        `[AutoReschedule] Found next slot in same bay ${currentBayId} for task ${task._id}`
      );
      return {
        bayId: currentBayId,
        start: slot.start,
        end: slot.end,
        priority: "same_bay_next_slot",
      };
    }

    // Ưu tiên 2: Tìm slot sau của bay khác (bắt đầu từ expected_end_time hiện tại)
    const allBays = await Bay.find({});
    for (const bay of allBays) {
      if (bay._id.toString() === currentBayId.toString()) {
        continue; // Skip bay hiện tại
      }

      const nextSlotOtherBay = await this.findNextNSlotsForBayId(
        bay._id,
        1,
        durationInMinutes,
        currentEndTime,
        []
      );

      if (nextSlotOtherBay.length > 0) {
        const slot = nextSlotOtherBay[0];
        console.log(
          `[AutoReschedule] Found next slot in other bay ${bay._id} for task ${task._id}`
        );
        return {
          bayId: bay._id,
          start: slot.start,
          end: slot.end,
          priority: "other_bay_next_slot",
        };
      }
    }

    // Ưu tiên 3: Tìm slot xa hơn (từ bây giờ)
    const futureSlotSameBay = await this.findNextNSlotsForBayId(
      currentBayId,
      1,
      durationInMinutes,
      now,
      [task._id.toString()]
    );

    if (futureSlotSameBay.length > 0) {
      const slot = futureSlotSameBay[0];
      console.log(
        `[AutoReschedule] Found future slot in same bay ${currentBayId} for task ${task._id}`
      );
      return {
        bayId: currentBayId,
        start: slot.start,
        end: slot.end,
        priority: "same_bay_future_slot",
      };
    }

    // Cuối cùng: Tìm slot xa hơn ở bay khác
    for (const bay of allBays) {
      if (bay._id.toString() === currentBayId.toString()) {
        continue;
      }

      const futureSlotOtherBay = await this.findNextNSlotsForBayId(
        bay._id,
        1,
        durationInMinutes,
        now,
        []
      );

      if (futureSlotOtherBay.length > 0) {
        const slot = futureSlotOtherBay[0];
        console.log(
          `[AutoReschedule] Found future slot in other bay ${bay._id} for task ${task._id}`
        );
        return {
          bayId: bay._id,
          start: slot.start,
          end: slot.end,
          priority: "other_bay_future_slot",
        };
      }
    }

    console.warn(
      `[AutoReschedule] No available slot found for task ${task._id}`
    );
    return null;
  }

  /**
   * Tự động dời lịch task chưa bắt đầu nhưng đã trễ giờ dự kiến (ví dụ >30 phút)
   * Ưu tiên tìm slot mới kể từ thời điểm hiện tại, theo thứ tự:
   * 1. Bay hiện tại
   * 2. Bay khác
   */
  async autoRescheduleMissedTask(task) {
    const now = new Date();

    const currentStartTime =
      task.expected_start_time instanceof Date
        ? task.expected_start_time
        : new Date(task.expected_start_time);
    const currentEndTime =
      task.expected_end_time instanceof Date
        ? task.expected_end_time
        : new Date(task.expected_end_time);

    const durationInMinutes = Math.round(
      (currentEndTime.getTime() - currentStartTime.getTime()) / (60 * 1000)
    );

    if (durationInMinutes <= 0) {
      console.error(`[AutoReschedule] Invalid duration for task ${task._id}`);
      return null;
    }

    const currentBayId = task.assigned_bay_id;

    // Ưu tiên 1: Tìm slot từ thời điểm hiện tại ở bay hiện tại
    const nextSlotSameBay = await this.findNextNSlotsForBayId(
      currentBayId,
      1,
      durationInMinutes,
      now,
      [task._id.toString()]
    );

    if (nextSlotSameBay.length > 0) {
      const slot = nextSlotSameBay[0];
      console.log(
        `[AutoReschedule] Found slot (missed) in same bay ${currentBayId} for task ${task._id}`
      );
      return {
        bayId: currentBayId,
        start: slot.start,
        end: slot.end,
        priority: "same_bay_from_now",
      };
    }

    // Ưu tiên 2: Tìm slot từ thời điểm hiện tại ở các bay khác
    const allBays = await Bay.find({});
    for (const bay of allBays) {
      if (bay._id.toString() === currentBayId.toString()) {
        continue;
      }

      const nextSlotOtherBay = await this.findNextNSlotsForBayId(
        bay._id,
        1,
        durationInMinutes,
        now,
        []
      );

      if (nextSlotOtherBay.length > 0) {
        const slot = nextSlotOtherBay[0];
        console.log(
          `[AutoReschedule] Found slot (missed) in other bay ${bay._id} for task ${task._id}`
        );
        return {
          bayId: bay._id,
          start: slot.start,
          end: slot.end,
          priority: "other_bay_from_now",
        };
      }
    }

    console.warn(
      `[AutoReschedule] No available slot (missed) found for task ${task._id}`
    );
    return null;
  }
}

module.exports = {
  BaySchedulingService: new BaySchedulingService(),
  ERROR_CODES,
};
