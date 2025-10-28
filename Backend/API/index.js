const servicesRouter = require("./services.router");
const vehiclesRouter = require("./vehicles.router");
const bookingsRouter = require("./bookings.router");

module.exports = (app) => {
  app.use("/services", servicesRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/vehicles", vehiclesRouter);
}
