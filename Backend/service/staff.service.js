const { ServiceOrderTask } = require("../model");
const { clerkClient } = require("../config/clerk");

const TECHNICIAN_PAGE_SIZE =
  Number(process.env.CLERK_TECHNICIAN_PAGE_SIZE) || 100;
const ORG_MEMBERSHIP_PAGE_SIZE =
  Number(process.env.CLERK_ORG_MEMBERSHIP_PAGE_SIZE) || 100;
const CLERK_ORGANIZATION_ID = "org_32tzUd7dUcFW7Te5gxEO4VcgkX1";

function resolveFullName(user) {
  if (user.fullName) return user.fullName;
  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (composed) return composed;
  const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
  return primaryEmail || "Chưa cập nhật";
}

function resolvePosition(user, orgRole) {
  const roleName = orgRole.includes("staff") ? "staff" : "technician";
  return roleName;
}

async function fetchStaffUserIds() {
  if (!CLERK_ORGANIZATION_ID) {
    throw new Error(
      "CLERK_ORGANIZATION_ID is not configured. Please set it to filter staff members."
    );
  }

  const staffIds = new Set();
  const staffRolesById = new Map();
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response =
      await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: CLERK_ORGANIZATION_ID,
        limit: ORG_MEMBERSHIP_PAGE_SIZE,
        offset,
      });

    const memberships = response?.data || [];
    memberships.forEach((membership) => {
      const role = membership.role?.toLowerCase() || "";
      const userId = membership.publicUserData?.userId;

      if (!userId) {
        return;
      }

      if (role.includes("staff") || role.includes("technician")) {
        staffIds.add(userId);
        staffRolesById.set(userId, role);
      }
    });

    hasMore = memberships.length === ORG_MEMBERSHIP_PAGE_SIZE;
    offset += memberships.length;
  }

  return { staffIds, staffRolesById };
}

async function fetchTechniciansFromClerk() {
  const { staffIds, staffRolesById } = await fetchStaffUserIds();

  if (!staffIds.size) {
    return [];
  }

  const technicians = [];
  const idList = Array.from(staffIds);

  for (let i = 0; i < idList.length; i += TECHNICIAN_PAGE_SIZE) {
    const chunkIds = idList.slice(i, i + TECHNICIAN_PAGE_SIZE);

    const response = await clerkClient.users.getUserList({
      userId: chunkIds,
      limit: chunkIds.length,
    });

    const chunkUsers = response?.data || [];

    chunkUsers.forEach((user) => {
      const orgRole = staffRolesById.get(user.id);
      const position = resolvePosition(user, orgRole);
      if (position !== "technician" && position != "staff") {
        return;
      }

      technicians.push({
        technicianClerkId: user.id,
        technicianName: resolveFullName(user),
        position,
        email: user.emailAddresses?.[0]?.emailAddress || null,
        avatar: user.profileImageUrl || null,
      });
    });
  }

  return technicians;
}

class StaffService {
  /**
   * Return all technicians registered in Clerk that match the configured roles.
   */
  async getAllTechnicians() {
    return fetchTechniciansFromClerk();
  }

  /**
   * List all technicians in the system along with their status
   * whether they are currently assigned to any tasks.
   */
  async getTechniciansWithStatusAtThisMoment() {
    const technicians = await this.getAllTechnicians();

    // Find all tasks in progress
    const activeTasks = await ServiceOrderTask.find({
      status: "in_progress",
    }).exec();

    // Just data conversion
    const map = {};

    for (const task of activeTasks) {
      for (const assignedTech of task.assigned_technicians) {
        const technicianClerkId = assignedTech.technician_clerk_id;
        map[technicianClerkId] = {
          isBusy: true,
          assignedTaskId: task._id,
        };
      }
    }

    // circular dependency fix: import inside the method
    const { AttendanceService } = require("./attendance.service");
    const staffIdsPresent = await AttendanceService.getPresentStaffIdsNow(
      technicians
    );

    return technicians.map((technician) => {
      const info = map[technician.technicianClerkId] || {
        isBusy: false,
        assignedTaskId: null,
      };

      if (staffIdsPresent.includes(technician.technicianClerkId)) {
        info.isPresent = true;
      } else {
        info.isPresent = false;
      }

      return {
        ...technician,
        ...info,
      };
    });
  }
}

module.exports = {
  StaffService: new StaffService(),
};
