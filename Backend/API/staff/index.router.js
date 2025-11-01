const partRouter = require("./part.router");
const complaintRouter = require("./complaint.router");
const bayRouter = require("./bay.router");
const { authenticate } = require("../../middleware/guards/authen.middleware");

module.exports = (app) => {
  app.use("/staff/parts", partRouter);
  app.use("/staff/complaints", complaintRouter);
  app.use("/staff/bays", bayRouter);
};
