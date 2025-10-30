const { Bay, ServiceOrderTask, InspectionTask, ServicingTask } = require("../model");
const DomainError = require("../errors/domainError");
const serviceConfig = require("./config");

const ERROR_CODES = {
  BAYS_UNAVAILABLE: "BAYS_UNAVAILABLE"
};

function randomSelectFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ASSUMPTION: The number of clerks available at any moment
// is more or equal to the number of bays.

class BaySchedulingService {
  /**
   * Schedule an inspection task as soon as possible, assigning a bay and timeslot.
   * @param {string} serviceOrderId
   * @param {Number} durationToHoldForMinutes
   * @param {import("./types").TechnicianInfo[]} techniciansInfoArray
   * @returns {Promise<InspectionTask>}
   */
  async scheduleInspectionTask(serviceOrderId, durationToHoldForMinutes, techniciansInfoArray) {
    // TODO: VERY IMPORTANT: VALIDATE TECHNICIANS AVAILABILITY

    const slot = await this.findNextAvailableSlot(durationToHoldForMinutes);
    if (!slot) {
      throw new DomainError(
        "Không có khoảng thời gian trống phù hợp trong khung thời gian cho phép.",
        ERROR_CODES.BAYS_UNAVAILABLE,
        409
      );
    }

    // TODO: implement better bay selection strategy (e.g., least utilized)
    const bay = randomSelectFromArray(slot.candidateBays);

    const inspectionTask = new InspectionTask({
      service_order_id: serviceOrderId,
      expected_start_time: slot.start,
      expected_end_time: slot.end,
      actual_start_time: null,
      actual_end_time: null,
      assigned_technicians: techniciansInfoArray.map(ti => ({
        technician_clerk_id: ti.technicianClerkId,
        role: ti.role
      })),
      assigned_bay_id: bay._id
    });

    await inspectionTask.save();

    return inspectionTask;
  }

  /**
   * Schedule a servicing task as soon as possible, assigning a bay and timeslot.
   * @param {string} serviceOrderId
   * @param {number} durationToHoldForMinutes
   * @param {import("./types").TechnicianInfo[]} techniciansInfoArray
   * @returns {Promise<ServicingTask>}
   */
  async scheduleServicingTask(serviceOrderId, durationToHoldForMinutes, techniciansInfoArray) {
    // TODO: VERY IMPORTANT: VALIDATE TECHNICIANS AVAILABILITY

    const slot = await this.findNextAvailableSlot(durationToHoldForMinutes);
    if (!slot) {
      throw new DomainError(
        "Không có khoảng thời gian trống phù hợp trong khung thời gian cho phép.",
        ERROR_CODES.BAYS_UNAVAILABLE,
        409
      );
    }

    const bay = randomSelectFromArray(slot.candidateBays);

    const servicingTask = new ServicingTask({
      service_order_id: serviceOrderId,
      expected_start_time: slot.start,
      expected_end_time: slot.end,
      actual_start_time: null,
      actual_end_time: null,
      assigned_technicians: techniciansInfoArray.map(ti => ({
        technician_clerk_id: ti.technicianClerkId,
        role: ti.role
      })),
      assigned_bay_id: bay._id,
      timeline: []
    });

    await servicingTask.save();
    return servicingTask;
  }


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
  async findNextAvailableSlot(
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
  async findAvailableBay(expectedStartTime, expectedEndTime) {
    const bays = await Bay.find({});
    const availableBays = [];
    const conflictingTasksMap = {};

    for (const bay of bays) {
      // Finding tasks that conflict with the given time slot (state is not 'completed')
      let conflictingTasks = await ServiceOrderTask.find({
        assigned_bay_id: bay._id,
        $or: [
          {
            expected_start_time: { $lt: expectedEndTime, $gte: expectedStartTime },
          },
          {
            expected_end_time: { $gt: expectedStartTime, $lte: expectedEndTime },
          },
          {
            expected_start_time: { $lte: expectedStartTime },
            expected_end_time: { $gte: expectedEndTime },
          },
        ],
      }).exec();
      conflictingTasks = conflictingTasks.filter(task => task.state !== "completed");

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
