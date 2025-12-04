const express = require("express");
const router = express.Router();
const controller = require("../../controller/manager/loyalty.controller");

router.get("/overview", controller.getOverview);
router.get("/transactions", controller.getTransactions);
router.get("/catalog", controller.getCatalog);
router.get("/audits", controller.getRuleAudits);
router.get("/rules", controller.listRules);
router.get("/rules/:id", controller.getRuleDetail);
router.post("/rules", controller.createRule);
router.put("/rules/:id", controller.updateRule);
router.patch("/rules/:id/status", controller.updateRuleStatus);
router.delete("/rules/:id", controller.deleteRule);

module.exports = router;
