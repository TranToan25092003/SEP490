const { Clerk } = require("@clerk/clerk-sdk-node");
const { clerkClient } = require("../../config/clerk");
const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY,
});
module.exports.roleProtected = async (req, res, next) => {
  // console.log(req.headers);
  // // const { isSignedIn, token } = await clerkClient.authenticateRequest(req, {
  // //   authorizedParties: ["http://localhost:5173"],
  // // });

  // // console.log(isSignedIn);
  // // console.log(token);
  const userId = req.user.id;

  const user = await clerk.users.getUser(userId);
  // console.log(user);
  req.userId = userId;
  req.user = user;

  // clerkClient.organizations.getOrganizationMembershipList({});

  // code to find user belong to organization and role and their permission
  //   console.log(
  //     await clerkClient.users.getOrganizationMembershipList({ userId: userId })
  //   );

  const roleUserInOrganization =
    await clerkClient.users.getOrganizationMembershipList({ userId: userId });

  // console.log(roleUserInOrganization.data[0]?.role);
  if (
    roleUserInOrganization.data[0]?.role != "org:admin" &&
    roleUserInOrganization.data[0]?.role != "org:admin_secondary"
  ) {
    return res.status(403).json({
      error: "forbidden resource",
    });
  }

  req.role = roleUserInOrganization.data[0]?.role;

  // console.log(roleUserInOrganization.data[0]?.role);
  // const organization =
  //   await clerkClient.organizations.getOrganizationMembershipList({
  //     organizationId: "org_2vlKMp1OtZT5LxT5teFmhuP0MxL",
  //   });
  // console.log(organization.data[0].permissions);

  // console.log(membership);
  next();
};
