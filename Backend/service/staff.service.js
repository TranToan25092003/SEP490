const { ServiceOrderTask } = require("../model");
const { clerkClient } = require("../config/clerk");

const TECHNICIAN_PAGE_SIZE =
  Number(process.env.CLERK_TECHNICIAN_PAGE_SIZE) || 100;
const ORG_MEMBERSHIP_PAGE_SIZE =
  Number(process.env.CLERK_ORG_MEMBERSHIP_PAGE_SIZE) || 100;
const CLERK_ORGANIZATION_ID = "org_32tzUd7dUcFW7Te5gxEO4VcgkX1";
const STAFF_ROLE_KEYWORD = (process.env.CLERK_STAFF_ROLE_KEYWORD || "staff")
  .trim()
  .toLowerCase();

function resolveFullName(user) {
  if (user.fullName) return user.fullName;
  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (composed) return composed;
  const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
  return primaryEmail || "Chưa cập nhật";
}

function resolvePosition(user) {
  console.log(user);
  const metadataPosition =
    user.publicMetadata?.position ||
    user.publicMetadata?.jobTitle ||
    user.privateMetadata?.position;
  return metadataPosition || "staff";
}

async function fetchStaffUserIds() {
  if (!CLERK_ORGANIZATION_ID) {
    throw new Error(
      "CLERK_ORGANIZATION_ID is not configured. Please set it to filter staff members."
    );
  }

  const staffIds = new Set();
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
      if (role.includes(STAFF_ROLE_KEYWORD)) {
        staffIds.add(membership.publicUserData.userId);
      }
    });

    hasMore = memberships.length === ORG_MEMBERSHIP_PAGE_SIZE;
    offset += memberships.length;
  }

  console.log(staffIds);

  return staffIds;
}

async function fetchTechniciansFromClerk() {
  const staffIds = await fetchStaffUserIds();

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
      technicians.push({
        technicianClerkId: user.id,
        technicianName: resolveFullName(user),
        position: resolvePosition(user),
        email: user.emailAddresses?.[0]?.emailAddress || null,
        avatar: user.profileImageUrl || null,
      });
    });
  }
  console.log(technicians);

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
   *
   * @return {import("./types").TechnicianInfoWithAvailabilityDTO[]}
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

    return technicians.map((technician) => {
      const info = map[technician.technicianClerkId] || {
        isBusy: false,
        assignedTaskId: null,
      };

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
