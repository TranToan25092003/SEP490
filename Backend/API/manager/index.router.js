const partRouter = require("./part.router");
const goodsReceiptRouter = require("./goods-receipt.router");
const attendanceRouter = require("./attendance.router");
const activityLogManagerRouter = require("./activity-log.router");
module.exports = (app) => {
  // Manager routes - temporarily disable authentication for testing
  app.use("/manager/parts", partRouter);
  app.use("/manager/goods-receipt", goodsReceiptRouter);
  app.use("/manager/attendance", attendanceRouter);
  app.use("/manager/activity-logs", activityLogManagerRouter);
  // Add more manager routes here as needed
  // app.use("/manager/other", authenticate, otherRouter);
};
