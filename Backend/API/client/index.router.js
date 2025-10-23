const { authenticate } = require("../../middleware/guards/authen.middleware");
const testRouter = require("./test.router");
const partRouter = require("./part.router");
const profileRouter = require("./profile.router");

module.exports = (app) => {
  // this router only for testing app do not use this router to write data ok
  app.use("/test", authenticate, testRouter);
  app.use("/parts", partRouter);
  app.use("/profile", authenticate, profileRouter);

  // ----------------------------------------------
};
