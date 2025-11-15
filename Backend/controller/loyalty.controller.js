const asyncHandler = require("../utils/asyncHandler");
const { LoyaltyService } = require("../service/loyalty.service");

exports.getBalance = asyncHandler(async (req, res) => {
  console.log(req.userId);
  const clerkId = req.userId;
  if (!clerkId) {
    return res
      .status(400)
      .json({ success: false, message: "clerkId required" });
  }

  const data = await LoyaltyService.getBalanceByClerkId(clerkId);
  res.json({ success: true, data });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const clerkId = req.userId;
  if (!clerkId) {
    return res
      .status(400)
      .json({ success: false, message: "clerkId required" });
  }

  const { limit, page } = req.query;
  const data = await LoyaltyService.getHistory(clerkId, { limit, page });
  res.json({ success: true, data });
});

exports.awardPoints = asyncHandler(async (req, res) => {
  const { clerkId, points, reason, sourceRef, expiresAt, metadata } = req.body;
  const performedBy = req.user?.clerkId;

  const result = await LoyaltyService.awardPoints({
    clerkId,
    points,
    reason,
    sourceRef,
    expiresAt,
    performedBy,
    metadata,
  });

  res.status(201).json({ success: true, data: result });
});

exports.redeemPoints = asyncHandler(async (req, res) => {
  const { clerkId, points, reason, sourceRef, metadata } = req.body;
  const performedBy = req.user?.clerkId;

  const result = await LoyaltyService.redeemPoints({
    clerkId,
    points,
    reason,
    sourceRef,
    performedBy,
    metadata,
  });

  res.status(201).json({ success: true, data: result });
});

exports.adjustPoints = asyncHandler(async (req, res) => {
  const { clerkId, points, reason, metadata } = req.body;
  const performedBy = req.user?.clerkId;

  const result = await LoyaltyService.adjustPoints({
    clerkId,
    points,
    reason,
    performedBy,
    metadata,
  });

  res.status(201).json({ success: true, data: result });
});

exports.redeemVoucher = asyncHandler(async (req, res) => {
  const clerkId = req.userId || req.body.clerkId;
  if (!clerkId) {
    return res
      .status(400)
      .json({ success: false, message: "clerkId required" });
  }

  const { rewardId, metadata } = req.body;
  const performedBy = req.user?.clerkId || clerkId;

  console.log(metadata);

  const result = await LoyaltyService.redeemVoucher({
    clerkId,
    rewardId,
    metadata,
    performedBy,
  });

  res.status(201).json({ success: true, data: result });
});
