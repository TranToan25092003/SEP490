const { Bay, ServiceOrderTask, InspectionTask, ServicingTask } = require("../model");
const DomainError = require("../errors/domainError");
const serviceConfig = require("./config");

const ERROR_CODES = {
  BAYS_UNAVAILABLE: "BAYS_UNAVAILABLE"
};

function randomSelectFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class BaySchedulingService {
  /**
   * Schedule an inspection task as soon as possible, assigning a bay and timeslot.
   * @param {string} serviceOrderId
   * @param {Number} durationToHoldForMinutes
   * @param {{
   *  technicianClerkId: string,
   *  role: "lead" | "assistant"
   * }[]} techniciansInfo
   * @returns {Promise<InspectionTask>}
   */
  async scheduleInspectionTask(serviceOrderId, durationToHoldForMinutes, techniciansInfo) {
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
      assigned_technicians: techniciansInfo.map(ti => ({
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
   * @param {{ technicianClerkId: string, role: "lead" | "assistant" }[]} techniciansInfo
   * @returns {Promise<ServicingTask>}
   */
  async scheduleServicingTask(serviceOrderId, durationToHoldForMinutes, techniciansInfo) {
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
      assigned_technicians: techniciansInfo.map(ti => ({
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
    const initial = new Date(starting);

    while (starting.getTime() - initial.getTime() < maxCutOffDate.getTime() - initial.getTime()) {
      const end = new Date(starting.getTime() + durationInMinutes * 60_000);
      const [availableBays, conflictingTasksMap] = await this.findAvailableBay(starting, end);

      if (availableBays.length > 0) {
        return {
          start: starting,
          end: end,
          candidateBays: availableBays,
        };
      } else {
        let nextTime = null;
        for (const tasks of Object.values(conflictingTasksMap)) {
          for (const t of tasks) {
            const candidate = t.expected_end_time.getTime() + 2_000;
            if (nextTime === null || candidate < nextTime.getTime()) {
              nextTime = new Date(candidate);
            }
          }
        }

        // fallback: if for some reason we couldn't derive a next time, bump by the duration
        starting = nextTime || new Date(end.getTime());
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
      const conflictingTasks = await ServiceOrderTask.find({
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
      });

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
