const { authenticate } = require("../../middleware/guards/authen.middleware");
const testRouter = require("./test.router");
const partRouter = require("./part.router");
const profileRouter = require("./profile.router");
const vehicleModelRouter = require("./vehicle-model.router");
const complaintRouter = require("./complaint.router");
const invoiceRouter = require("./invoice.router");
const activityLogRouter = require("./activity-log.router");

module.exports = (app) => {
  // this router only for testing app do not use this router to write data ok
  app.use("/test", authenticate, testRouter);
  app.use("/parts", partRouter);
  app.use("/profile", authenticate, profileRouter);
  app.use("/models", vehicleModelRouter);
  app.use("/complaints", complaintRouter);
  app.use("/activity-logs", authenticate, activityLogRouter);
  app.use("/invoices", authenticate, invoiceRouter);
  // ----------------------------------------------
};
