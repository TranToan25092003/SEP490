const partRouter = require("./part.router");
const complaintRouter = require("./complaint.router");
const bayRouter = require("./bay.router");
const invoiceRouter = require("./invoice.router");
const { authenticate } = require("../../middleware/guards/authen.middleware");

module.exports = (app) => {
  app.use("/staff/parts", authenticate, partRouter);
  app.use("/staff/complaints", authenticate, complaintRouter);
  app.use("/staff/bays", bayRouter);
  app.use("/staff/invoices", invoiceRouter);
};
