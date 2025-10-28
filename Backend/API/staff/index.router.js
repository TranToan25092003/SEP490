const { authenticate } = require("../../middleware/guards/authen.middleware");
const partRouter = require("./part.router");
const complaintRouter = require("./complaint.router");

module.exports = (app) => {
  app.use("/staff/parts", partRouter);
  app.use("/staff/complaints", complaintRouter);
};
