const { clerkClient } = require("../config/clerk");

class UsersService {
  async getFullNamesByIds(userIds) {
    const uniqueUserIds = [...new Set(userIds)];

    const users = await clerkClient.users.getUserList({
      userId: uniqueUserIds,
      limit: uniqueUserIds.length,
    });

    const idToFullNameMap = {};
    for (const id of uniqueUserIds) {
      idToFullNameMap[id] = "Không có tên";
    }

    users.data.forEach(user => {
      idToFullNameMap[user.id] = user.fullName || "Không có tên";
    });

    return idToFullNameMap;
  }
}

module.exports = {
  UsersService: new UsersService()
}
