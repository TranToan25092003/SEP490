const { authenticate } = require("../../middleware/guards/authen.middleware");
const testRouter = require("./test.router");
const partRouter = require("./part.router");
const vehicleModelRouter = require("./vehicle-model.router");

module.exports = (app) => {
  // this router only for testing app do not use this router to write data ok
  app.use("/test", authenticate, testRouter);
  app.use("/parts", partRouter);
  app.use("/models", vehicleModelRouter);
  // ----------------------------------------------
};
