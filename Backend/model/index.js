const Test = require("./test.model");

const Banner = require("./banner.model");
const Bay = require("./bay.model");
const Complain = require("./complaint.model");
const DiscountCode = require("./discount_codes.model");
const GoodsReceipt = require("./goods_receipt.model");
const GoodsReceiptItem = require("./goods_receipt_item.model");
const Invoice = require("./invoice.model");
const LoyalPoint = require("./loyalty_points.model");
const MaintenanceRule = require("./maintenance_rule.model");
const Notification = require("./notification.model");
const Part = require("./part.model");
const Quote = require("./quote.model");
const MediaAsset = require("./media_asset.model");
const RecallVehicles = require("./recall_vehicles.model");
const Recall = require("./recall.model");
const {
  ServiceOrder,
  CustomOrderItem,
  PartOrderItem,
  ServiceOrderItem,
} = require("./service_order.model");
const {
  InspectionTask,
  ServicingTask,
  ServiceOrderTask,
} = require("./service_order_task.model");
const Booking = require("./booking.model");
const Service = require("./service.model");
const ModelVehicle = require("./vehicle_model.model");
const Vehicle = require("./vehicle.model");
const Warranty = require("./warranty.model");
const ActivityLog = require("./activity_log.model");

module.exports = {
  Test,
  Banner,
  Bay,
  Complain,
  DiscountCode,
  GoodsReceipt,
  GoodsReceiptItem,
  Invoice,
  LoyalPoint,
  MaintenanceRule,
  Notification,
  Part,
  Quote,
  MediaAsset,
  RecallVehicles,
  Recall,
  ServiceOrder,
  ServiceOrderItem,
  PartOrderItem,
  CustomOrderItem,
  Service,
  ModelVehicle,
  InspectionTask,
  ServicingTask,
  ServiceOrderTask,
  Vehicle,
  Warranty,
  Booking,
  ActivityLog,
};
