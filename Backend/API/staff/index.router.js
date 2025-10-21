const { authenticate } = require("../../middleware/guards/authen.middleware");
const partRouter = require("./part.router");

module.exports = (app) => {
  app.use("/staff/parts", partRouter);
};
