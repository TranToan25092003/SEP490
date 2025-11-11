const { ServiceOrderTask } = require("../model");

async function getAllTechnicians() {
  return [
    {
      technicianClerkId: "clerk_1",
      technicianName: "John Doe"
    },
    {
      technicianClerkId: "clerk_2",
      technicianName: "Jane Smith"
    },
    {
      technicianClerkId: "clerk_3",
      technicianName: "Bob Johnson"
    },
    {
      technicianClerkId: "clerk_4",
      technicianName: "Alice Williams"
    }
  ];
}

class StaffService {
  async getTechniciansWithStatusAtThisMoment() {
    const technicians = await getAllTechnicians();

    // Find all tasks in progress
    const activeTasks = await ServiceOrderTask.find({
      status: "in_progress"
    }).exec();

    // Just data conversion
    const map = {};

    for (const task of activeTasks) {
      for (const assignedTech of task.assigned_technicians) {
        const technicianClerkId = assignedTech.technician_clerk_id;
        map[technicianClerkId] = {
          isBusy: true,
          assignedTaskId: task._id
        };
      }
    }

    return technicians.map(technician => {
      const info = map[technician.technicianClerkId] || {
        isBusy: false,
        assignedTaskId: null
      };

      return {
        ...technician,
        ...info
      };
    });
  }
}

module.exports = {
  StaffService: new StaffService(),
}
