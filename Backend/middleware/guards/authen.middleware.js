const { verifyToken } = require("@clerk/backend");
const { clerkClient } = require("../../config/clerk");

module.exports.authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies.__session || req.headers?.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please login",
      });
    }

    const tokenPayload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      clockSkewInMs: 300000, // avoid IAT error
    });

    const user = await clerkClient.users.getUser(tokenPayload.sub);

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
