const servicesRouter = require("./services.router");
const vehiclesRouter = require("./vehicles.router");
const bookingsRouter = require("./bookings.router");
const serviceOrderRouter = require("./service-order.router");
const serviceTaskRouter = require("./service-tasks.router");
const technicianRouter = require("./technicians.router");
const quotesRouter = require("./quotes.router");
const notificationRouter = require("./notification.router");

module.exports = (app) => {
  app.use("/services", servicesRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/vehicles", vehiclesRouter);
  app.use("/service-orders", serviceOrderRouter);
  app.use("/service-tasks", serviceTaskRouter);
  app.use("/technicians", technicianRouter);
  app.use("/quotes", quotesRouter);
  app.use("/notifications", notificationRouter);
}
