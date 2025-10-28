const servicesRouter = require("./services.router");
const vehiclesRouter = require("./vehicles.router");
const bookingsRouter = require("./bookings.router");
const serviceOrderRouter = require("./service-order.router");

module.exports = (app) => {
  app.use("/services", servicesRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/vehicles", vehiclesRouter);
  app.use("/service-orders", serviceOrderRouter);
}
