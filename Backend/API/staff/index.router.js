const partRouter = require("./part.router");
const complaintRouter = require("./complaint.router");
const bayRouter = require("./bay.router");
const invoiceRouter = require("./invoice.router");

module.exports = (app) => {
  app.use("/staff/parts", partRouter);
  app.use("/staff/complaints", complaintRouter);
  app.use("/staff/bays", bayRouter);
  app.use("/staff/invoices", invoiceRouter);
};
