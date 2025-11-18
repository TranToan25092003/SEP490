const { authenticate } = require("../../middleware/guards/authen.middleware");
const serviceRouter = require("./service.router");
const modelRouter = require("./model.router");
const bannerRouter = require("./banner.router");
const activityLogRouter = require("./activity-log.router");

module.exports = (app) => {
  app.use("/admin/services",  authenticate, serviceRouter); 
  app.use("/admin/models",  authenticate, modelRouter); 
  app.use("/admin/banners",  authenticate, bannerRouter); 
  app.use("/admin/activity-logs", activityLogRouter);
};
