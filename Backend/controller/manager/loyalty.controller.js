const asyncHandler = require("../../utils/asyncHandler");
const { LoyaltyService } = require("../../service/loyalty.service");
const LoyaltyRulesService = require("../../service/manager/loyaltyRules.service");

const buildActor = (req) => ({
  id: req.user?.clerkId || req.userId || null,
  name: req.user?.fullName || req.user?.name || null,
  email: req.user?.email || null,
});

exports.getOverview = asyncHandler(async (req, res) => {
  const { windowDays } = req.query;
  const data = await LoyaltyService.getProgramOverview({ windowDays });
  res.json({ success: true, data });
});

exports.getTransactions = asyncHandler(async (req, res) => {
  const { limit, type } = req.query;
  const data = await LoyaltyService.getTransactions({ limit, type });
  res.json({ success: true, data });
});

exports.getCatalog = asyncHandler(async (_req, res) => {
  const data = await LoyaltyService.getCatalogDetails();
  res.json({ success: true, data });
});

exports.getRuleAudits = asyncHandler(async (req, res) => {
  const data = await LoyaltyRulesService.listAudits(req.query);
  res.json({ success: true, data });
});

exports.listRules = asyncHandler(async (req, res) => {
  const data = await LoyaltyRulesService.listRules(req.query);
  res.json({ success: true, data });
});

exports.getRuleDetail = asyncHandler(async (req, res) => {
  const data = await LoyaltyRulesService.getRuleById(req.params.id);
  res.json({ success: true, data });
});

exports.createRule = asyncHandler(async (req, res) => {
  const actor = buildActor(req);
  const data = await LoyaltyRulesService.createRule(req.body, actor);
  res.status(201).json({ success: true, data });
});

exports.updateRule = asyncHandler(async (req, res) => {
  const actor = buildActor(req);
  const data = await LoyaltyRulesService.updateRule(
    req.params.id,
    req.body,
    actor
  );
  res.json({ success: true, data });
});

exports.updateRuleStatus = asyncHandler(async (req, res) => {
  const actor = buildActor(req);
  const { status } = req.body;
  const data = await LoyaltyRulesService.updateStatus(req.params.id, status, actor);
  res.json({ success: true, data });
});

exports.deleteRule = asyncHandler(async (req, res) => {
  const actor = buildActor(req);
  await LoyaltyRulesService.deleteRule(req.params.id, actor);
  res.json({ success: true });
});
