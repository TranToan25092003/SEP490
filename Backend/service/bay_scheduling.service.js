const { Bay, ServiceOrderTask, InspectionTask, ServicingTask } = require("../model");
const DomainError = require("../errors/domainError");
const serviceConfig = require("./config");

const ERROR_CODES = {
  BAYS_UNAVAILABLE: "BAYS_UNAVAILABLE"
};

class BaySchedulingService {
  /**
   * Schedule an inspection task as soon as possible, assigning a bay and timeslot.
   * @param {string} serviceOrderId
   * @param {Date} start
   * @param {Date} end
   * @param {string} bayId
   * @returns {Promise<InspectionTask>}
   */
  async scheduleInspectionTask(serviceOrderId, start, end, bayId) {
    const overlappingTasks = await this.findOverlappingTasksForBayId(bayId, start, end);
    if (overlappingTasks.length > 0) {
      throw new DomainError(
        "The selected bay is not available for the requested time slot.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    if (end.getHours() > serviceConfig.BUSINESS_END_HOUR || start.getHours() < serviceConfig.BUSINESS_START_HOUR) {
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

  /**
   * Schedule a servicing task as soon as possible, assigning a bay and timeslot.
   * @param {string} serviceOrderId
   * @param {Date} start
   * @param {Date} end
   * @param {string} bayId
   * @returns {Promise<ServicingTask>}
   */
  async scheduleServicingTask(serviceOrderId, start, end, bayId) {
    const overlappingTasks = await this.findOverlappingTasksForBayId(bayId, start, end);
    if (overlappingTasks.length > 0) {
      throw new DomainError(
        "The selected bay is not available for the requested time slot.",
        ERROR_CODES.BAYS_UNAVAILABLE
      );
    }

    if (end.getHours() > serviceConfig.BUSINESS_END_HOUR || start.getHours() < serviceConfig.BUSINESS_START_HOUR) {
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
      timeline: []
    });

    await servicingTask.save();
    return servicingTask;
  }

  async findOverlappingTasksForBayId(bayId, start, end) {
    const conflictingTasks = await ServiceOrderTask.find({
      assigned_bay_id: bayId,
      status: { $ne: "completed" },
      expected_start_time: { $lt: end },
      expected_end_time: { $gt: start },
    }).exec();

    return conflictingTasks;
  }

  async findNextNSlotsForBayId(
    bayId,
    n,
    durationInMinutes,
    startOfDayHours = serviceConfig.BUSINESS_START_HOUR,
    endOfDayHours = serviceConfig.BUSINESS_END_HOUR,
    starting = new Date(),
    maxCutOffDate = new Date(
      Date.now() + (serviceConfig?.DEFAULT_MAX_LOOKAHEAD_MILLISECONDS || 10 * 3_600_000)
    )
  ) {
    const slots = [];

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

      const endTime = new Date(startTime.getTime() + durationInMinutes * 60_000);

      if (endTime > endOfDay) {
        startTime = startOfNextDay;
        continue;
      }

      const overlappingTasks = await this.findOverlappingTasksForBayId(bayId, startTime, endTime);
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

  // UNUSED

  /**
   * Greedy find next available timeslot for duration
   * @param {Number} durationInMinutes - duration needed
   * @param {Date | undefined} starting - starting time to search from
   * @param {Date | undefined} maxCutOffDate - maximum date to search until
   * @returns {{
   *  start: Date,
   *  end: Date,
   *  candidateBays: Bay[]
   * } | null}
   */
  async findNextAvailableSlotGlobally(
    durationInMinutes,
    starting = new Date(),
    maxCutOffDate = new Date(
      Date.now() + (serviceConfig?.DEFAULT_MAX_LOOKAHEAD_MILLISECONDS || 10 * 3_600_000)
    )
  ) {
    while (starting < maxCutOffDate) {
      const end = new Date(starting.getTime() + durationInMinutes * 60_000);
      const [availableBays, conflictingTasksMap] = await this.findAvailableBay(starting, end);

      if (availableBays.length > 0) {
        return {
          start: starting,
          end: end,
          candidateBays: availableBays,
        };
      } else {
        // Preprocess: Finding the maximum endtime of conflicting tasks per bay
        const maxEndTimePerBay = [];
        for (const conflictingTasksPerBay of Object.values(conflictingTasksMap)) {
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

  /**
   * Find available bays for the given time slot.
   * @param {Date} expectedStartTime
   * @param {Date} expectedEndTime
   * @returns {Promise<[Bay[], { [bayId: string]: ServiceOrderTask[] }]>} List of available bays and map of conflicting tasks.
   */
  async findAvailableBayGlobally(expectedStartTime, expectedEndTime) {
    const bays = await Bay.find({});
    const availableBays = [];
    const conflictingTasksMap = {};

    for (const bay of bays) {
      const conflictingTasks = await this.findOverlappingTasksForBayId(bay._id, expectedStartTime, expectedEndTime);

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
  ERROR_CODES
}
