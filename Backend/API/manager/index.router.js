const partRouter = require("./part.router");
const goodsReceiptRouter = require("./goods-receipt.router");
const attendanceRouter = require("./attendance.router");

module.exports = (app) => {
  // Manager routes - temporarily disable authentication for testing
  app.use("/manager/parts", partRouter);
  app.use("/manager/goods-receipt", goodsReceiptRouter);
  app.use("/manager/attendance", attendanceRouter);

  // Add more manager routes here as needed
  // app.use("/manager/other", authenticate, otherRouter);
};
