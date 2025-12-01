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
    const task = await ServiceOrderTask.findById(taskId).exec();
    if (!task) {
      throw new DomainError("Task not found", ERROR_CODES.TASK_NOT_FOUND);
    }

    const bayInfo = await Bay.findById(bayId).exec();
    if (!bayInfo || bayInfo.status !== "available") {
      throw new DomainError("Bay not found", ERROR_CODES.BAYS_UNAVAILABLE);
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

    await task.save();

    return task;
  }

  async scheduleInspectionTask(serviceOrderId, start, end, bayId) {
    const bayInfo = await Bay.findById(bayId).exec();
    if (!bayInfo || bayInfo.status !== "available") {
      throw new DomainError("Bay not found", ERROR_CODES.BAYS_UNAVAILABLE);
    }

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
    const bayInfo = await Bay.findById(bayId).exec();
    if (!bayInfo || bayInfo.status !== "available") {
      throw new DomainError("Bay not found", ERROR_CODES.BAYS_UNAVAILABLE);
    }

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

    if (starting < new Date()) {
      starting = new Date();
    }

    let startTime = new Date(starting);

    // Clamp starting time to business hours
    if (starting.getHours() < startOfDayHours) {
      startTime.setHours(startOfDayHours, 0, 0, 0);
    } else if (starting.getHours() >= endOfDayHours) {
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(startOfDayHours, 0, 0, 0);
    }

    while (slots.length < n && startTime < maxCutOffDate) {
      const startOfNextDay = new Date(startTime);
      startOfNextDay.setDate(startOfNextDay.getDate() + 1);
      startOfNextDay.setHours(startOfDayHours, 0, 0, 0);

      const endOfDay = new Date(startTime);
      endOfDay.setHours(endOfDayHours, 0, 0, 0);

      const endTime = new Date(
        startTime.getTime() + durationInMinutes * 60_000
      );

      if (endTime > endOfDay) {
        startTime = startOfNextDay;
        continue;
      }

      const overlappingTasks = await this.findOverlappingTasksForBayId(
        bayId,
        startTime,
        endTime,
        ignoredTaskIds
      );
      if (overlappingTasks.length === 0) {
        slots.push({ start: startTime, end: endTime });
        startTime = new Date(startTime.getTime() + durationInMinutes * 60_000);
      } else {
        const maxEndTime = overlappingTasks.reduce((max, task) => {
          return task.expected_end_time > max ? task.expected_end_time : max;
        }, startTime);

        startTime = new Date(maxEndTime);
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
}

module.exports = {
  BaySchedulingService: new BaySchedulingService(),
  ERROR_CODES,
};
