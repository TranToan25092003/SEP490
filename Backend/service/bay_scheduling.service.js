const { Bay, ServiceOrderTask, CheckInTask, ServicingTask } = require("../model");
const DomainError = require("../errors/domainError");
const config = require("../config");

const ERROR_CODES = {
  BAYS_UNAVAILABLE: "BAYS_UNAVAILABLE",
};

class BaySchedulingService {
  /**
   * Schedule a check-in task at the given timeslot.
   * @param {Date} checkInTimeslot
   * @returns {Promise<CheckInTask>} The scheduled check-in task.
   * @throws {DomainError} If no bays are available for the given timeslot.
   */
  async scheduleCheckIn(serviceOrderId, checkInTimeslot) {
    const start = new Date(checkInTimeslot);
    const end = new Date(start.getTime() + config.AVERAGE_TIME_TO_COMPLETE_CHECK_IN_MILLISECONDS);

    const availableBays = await this.findAvailableBay(start, end);
    if (availableBays.length === 0) {
      throw new DomainError(
        "No available bays for the given timeslot.",
        ERROR_CODES.BAYS_UNAVAILABLE,
        409
      );
    }

    const checkInTask = new CheckInTask({
      service_order_id: serviceOrderId,
      expected_start_time: start,
      expected_end_time: end,
      actual_start_time: null,
      actual_end_time: null,
      assigned_technicians: [],
      assigned_bay_id: availableBays[0]._id
    });

    await checkInTask.save();

    return checkInTask;
  }

  /**
   * Schedule a servicing task at the given timeslot.
   * @param {string} serviceOrderId
   * @param {{
   *   technicianClerkId: string,
   *   role: "lead" | "assistant"
   * }[]} techniciansInfo
   * @param {Date} expectedStartTime
   * @param {Date} expectedEndTime
   * @returns {Promise<ServicingTask>} The scheduled servicing task.
   * @throws {DomainError} If no bays are available for the given timeslot.
   */
  async scheduleServicingTask(serviceOrderId, techniciansInfo, expectedStartTime, expectedEndTime) {
    const availableBays = await this.findAvailableBay(expectedStartTime, expectedEndTime);
    if (availableBays.length === 0) {
      throw new DomainError(
        "No available bays for the given timeslot.",
        ERROR_CODES.BAYS_UNAVAILABLE,
        409
      );
    }

    const servicingTask = new ServicingTask({
      service_order_id: serviceOrderId,
      expected_start_time: expectedStartTime,
      expected_end_time: expectedEndTime,
      actual_start_time: null,
      actual_end_time: null,
      assigned_technicians: techniciansInfo.map(ti => ({
        technician_clerk_id: ti.technicianClerkId,
        role: ti.role
      })),
      assigned_bay_id: availableBays[0]._id,
      timeline: []
    });

    await servicingTask.save();

    return servicingTask;
  }

  /**
   * Find available bays for the given time slot.
   * @param {Date} expectedStartTime
   * @param {Date} expectedEndTime
   * @returns {Promise<Bay[]>} List of available bays
   */
  async findAvailableBay(expectedStartTime, expectedEndTime) {
    const bays = await Bay.find({});
    const availableBays = [];

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
      }
    }

    return availableBays;
  }

}


module.exports = new BaySchedulingService();
