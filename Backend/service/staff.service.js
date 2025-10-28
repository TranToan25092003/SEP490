const { ServiceOrderTask } = require("../model");

/**
 * Use this function to get all technicians in the system.
 * Right now it is a stub that returns some mock data.
 * Replace this will calls to actual Clerk API.
 * @returns {{
 *   technicianClerkId: string,
 *   technicianName: string
 * }[]}
 */
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
  /**
   * List all technicians in the system along with their status
   * whether they are currently assigned to any tasks.
   *
   * @return {{
   *   technicianClerkId: string,
   *   technicianName: string,
   *   isBusy: boolean,
   *   assignedTaskId: string | null
   * }}
   */
  async getTechniciansStatus() {
    const technicians = await getAllTechnicians();
  }
}

module.exports = {
  StaffService: new StaffService(),
}
