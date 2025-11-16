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

  async getUserIdsByFullName(fullName) {
    const users = await clerkClient.users.getUserList({
      query: fullName
    });

    return users.data.map(user => user.id);
  }

  async getProfilesByIds(userIds) {
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (!uniqueIds.length) return {};

    const users = await clerkClient.users.getUserList({
      userId: uniqueIds,
      limit: uniqueIds.length,
    });

    const defaultProfile = {
      fullName: "Không có tên",
      email: null,
      avatar: null,
    };

    const profileMap = Object.fromEntries(
      uniqueIds.map((id) => [id, { ...defaultProfile }])
    );

    users.data.forEach((user) => {
      const emailAddress =
        user?.emailAddresses?.find(
          (email) => email.id === user.primaryEmailAddressId
        )?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
      profileMap[user.id] = {
        fullName: user.fullName || defaultProfile.fullName,
        email: emailAddress,
        avatar: user.imageUrl || null,
      };
    });

    return profileMap;
  }
}

module.exports = {
  UsersService: new UsersService()
}
