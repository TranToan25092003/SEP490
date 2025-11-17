const partRouter = require("./part.router");
const complaintRouter = require("./complaint.router");
const bayRouter = require("./bay.router");
const invoiceRouter = require("./invoice.router");
const dashboardRouter = require("./dashboard.router");
const { authenticate } = require("../../middleware/guards/authen.middleware");
const complaintCategoryRouter = require("./complaint-category.router");

module.exports = (app) => {
  app.use("/staff/parts", authenticate, partRouter);
  app.use("/staff/complaints", authenticate, complaintRouter);
  app.use("/staff/complaint-categories", complaintCategoryRouter);
  app.use("/staff/bays", bayRouter);
  app.use("/staff/invoices", invoiceRouter);
  app.use("/staff/dashboard", authenticate, dashboardRouter);
};
