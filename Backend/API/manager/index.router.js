const { authenticate } = require("../../middleware/guards/authen.middleware");
const partRouter = require("./part.router");

module.exports = (app) => {
  // Manager routes - temporarily disable authentication for testing
  app.use("/manager/parts", partRouter);

  // Add more manager routes here as needed
  // app.use("/manager/other", authenticate, otherRouter);
};
