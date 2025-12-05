const { UsersService } = require("../../service/users.service");
const { clerkClient } = require("../../config/clerk");

jest.mock("../../config/clerk", () => ({
  clerkClient: {
    users: {
      getUserList: jest.fn(),
    },
  },
}));

describe("UsersService", () => {
  const defaultName = "Không có tên";
  const defaultProfile = {
    fullName: defaultName,
    email: null,
    avatar: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getFullNamesByIds", () => {
    test("UC0001_emptyInput_returnsEmptyMap", async () => {
      clerkClient.users.getUserList.mockResolvedValue({ data: [] });

      const result = await UsersService.getFullNamesByIds([]);

      expect(clerkClient.users.getUserList).toHaveBeenCalledWith({
        userId: [],
        limit: 0,
      });
      expect(result).toEqual({});
    });

    test("UC0002_dedup_and_default_missing_names", async () => {
      const userIds = ["user_1", "user_1", "user_2", "user_3"];

      clerkClient.users.getUserList.mockResolvedValue({
        data: [
          { id: "user_1", fullName: "Jane Doe" },
          { id: "user_3", fullName: "" },
        ],
      });

      const result = await UsersService.getFullNamesByIds(userIds);

      expect(clerkClient.users.getUserList).toHaveBeenCalledWith({
        userId: ["user_1", "user_2", "user_3"],
        limit: 3,
      });
      expect(result).toEqual({
        user_1: "Jane Doe",
        user_2: defaultName,
        user_3: defaultName,
      });
    });

    test("UC0003_propagates_clerk_errors", async () => {
      const err = new Error("clerk down");
      clerkClient.users.getUserList.mockRejectedValue(err);

      await expect(UsersService.getFullNamesByIds(["user_1"])).rejects.toThrow(
        err
      );
    });
  });

  describe("getUserIdsByFullName", () => {
    test("UC0001_returns_ids_from_search", async () => {
      const fullName = "John Smith";
      clerkClient.users.getUserList.mockResolvedValue({
        data: [
          { id: "user_a", fullName },
          { id: "user_b", fullName },
        ],
      });

      const result = await UsersService.getUserIdsByFullName(fullName);

      expect(clerkClient.users.getUserList).toHaveBeenCalledWith({
        query: fullName,
      });
      expect(result).toEqual(["user_a", "user_b"]);
    });

    test("UC0002_propagates_clerk_errors", async () => {
      const err = new Error("clerk down");
      clerkClient.users.getUserList.mockRejectedValue(err);

      await expect(UsersService.getUserIdsByFullName("Alice")).rejects.toThrow(
        err
      );
    });
  });

  describe("getProfilesByIds", () => {
    test("UC0001_empty_or_falsy_ids_returns_empty_map", async () => {
      const result = await UsersService.getProfilesByIds([null, undefined, ""]);
      expect(clerkClient.users.getUserList).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    test("UC0002_dedup_primary_email_and_defaults", async () => {
      const userIds = ["user_1", "user_1", "user_2"];

      clerkClient.users.getUserList.mockResolvedValue({
        data: [
          {
            id: "user_1",
            fullName: "Alice",
            imageUrl: "http://avatar/1",
            primaryEmailAddressId: "email_1",
            emailAddresses: [
              { id: "email_1", emailAddress: "alice@example.com" },
              { id: "email_2", emailAddress: "alt@example.com" },
            ],
          },
          {
            id: "user_2",
            fullName: "",
            imageUrl: "",
            emailAddresses: [],
          },
        ],
      });

      const result = await UsersService.getProfilesByIds(userIds);

      expect(clerkClient.users.getUserList).toHaveBeenCalledWith({
        userId: ["user_1", "user_2"],
        limit: 2,
      });
      expect(result).toEqual({
        user_1: {
          fullName: "Alice",
          email: "alice@example.com",
          avatar: "http://avatar/1",
        },
        user_2: defaultProfile,
      });
    });

    test("UC0003_uses_first_email_when_no_primary", async () => {
      clerkClient.users.getUserList.mockResolvedValue({
        data: [
          {
            id: "user_x",
            fullName: "No Primary",
            imageUrl: "",
            emailAddresses: [
              { id: "email_1", emailAddress: "first@example.com" },
            ],
          },
        ],
      });

      const result = await UsersService.getProfilesByIds(["user_x"]);

      expect(result).toEqual({
        user_x: {
          fullName: "No Primary",
          email: "first@example.com",
          avatar: null,
        },
      });
    });

    test("UC0004_defaults_for_users_not_returned_by_clerk", async () => {
      clerkClient.users.getUserList.mockResolvedValue({
        data: [
          {
            id: "user_a",
            fullName: "Found A",
            emailAddresses: [],
            imageUrl: null,
          },
        ],
      });

      const result = await UsersService.getProfilesByIds(["user_a", "user_b"]);

      expect(result).toEqual({
        user_a: { fullName: "Found A", email: null, avatar: null },
        user_b: defaultProfile,
      });
    });

    test("UC0005_propagates_clerk_errors", async () => {
      const err = new Error("clerk down");
      clerkClient.users.getUserList.mockRejectedValue(err);

      await expect(UsersService.getProfilesByIds(["user_1"])).rejects.toThrow(
        err
      );
    });
  });
});
