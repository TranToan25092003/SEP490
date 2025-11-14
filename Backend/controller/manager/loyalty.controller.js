const asyncHandler = require("../../utils/asyncHandler");
const { LoyaltyService } = require("../../service/loyalty.service");

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
  const data = LoyaltyService.getCatalogDetails();
  res.json({ success: true, data });
});
