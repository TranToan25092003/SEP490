const { authenticate } = require("../../middleware/guards/authen.middleware");
const serviceRouter = require("./service.router");
const modelRouter = require("./model.router");
const bannerRouter = require("./banner.router");
const activityLogRouter = require("./activity-log.router");

module.exports = (app) => {
  app.use("/admin/services",  serviceRouter); 
  app.use("/admin/models",  modelRouter); 
  app.use("/admin/banners",  bannerRouter); 
  app.use("/admin/activity-logs", activityLogRouter);
};
