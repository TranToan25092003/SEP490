const { authenticate } = require("../../middleware/guards/authen.middleware");
const serviceRouter = require("./service.router");

module.exports = (app) => {
  app.use("/admin/services",  serviceRouter); 
};

