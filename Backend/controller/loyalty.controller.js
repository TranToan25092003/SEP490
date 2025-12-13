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

  console.log("🔵 redeemVoucher - Request:", {
    clerkId,
    rewardId,
    metadata,
    performedBy,
  });

  try {
    const result = await LoyaltyService.redeemVoucher({
      clerkId,
      rewardId,
      metadata,
      performedBy,
    });

    console.log("✅ redeemVoucher - Success:", {
      voucherCode: result?.voucher?.voucherCode,
      pointsCost: result?.voucher?.pointsCost,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ redeemVoucher - Error:", error);
    console.error("❌ redeemVoucher - Error message:", error?.message);
    console.error("❌ redeemVoucher - Error stack:", error?.stack);
    throw error; // Let asyncHandler handle it
  }
});

exports.dailyCheckIn = asyncHandler(async (req, res) => {
  const clerkId = req.userId;
  if (!clerkId) {
    return res
      .status(400)
      .json({ success: false, message: "clerkId required" });
  }

  const result = await LoyaltyService.dailyCheckIn(clerkId);
  res.status(201).json({ success: true, data: result });
});
