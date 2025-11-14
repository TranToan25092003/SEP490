const { LoyalPoint, LoyaltyTransaction, Invoice } = require("../model");

class LoyaltyService {
  async getOrCreateWallet(clerkId) {
    let wallet = await LoyalPoint.findOne({ clerkId });
    if (!wallet) {
      wallet = await LoyalPoint.create({ clerkId, total_points: 0 });
    }
    return wallet;
  }

  async getBalanceByClerkId(clerkId) {
    const wallet = await this.getOrCreateWallet(clerkId);
    return {
      clerkId,
      balance: wallet.total_points,
      updatedAt: wallet.updatedAt,
    };
  }

  async getHistory(clerkId, { limit = 20, page = 1 }) {
    const query = { clerkId };
    const sort = { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      LoyaltyTransaction.find(query).sort(sort).skip(skip).limit(Number(limit)),
      LoyaltyTransaction.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        limit: Number(limit),
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async awardPoints({
    clerkId,
    points,
    reason,
    sourceRef,
    expiresAt,
    performedBy,
    metadata,
  }) {
    if (points <= 0) throw new Error("Points must be positive for award");

    const wallet = await this.getOrCreateWallet(clerkId);
    wallet.total_points += points;
    wallet.updated_at = new Date();
    await wallet.save();

    const tx = await LoyaltyTransaction.create({
      clerkId,
      type: "earn",
      points,
      balanceAfter: wallet.total_points,
      reason,
      sourceRef,
      expiresAt,
      performedBy,
      metadata,
    });

    return { wallet, transaction: tx };
  }

  async redeemPoints({
    clerkId,
    points,
    reason,
    sourceRef,
    performedBy,
    metadata,
  }) {
    if (points <= 0) throw new Error("Points must be positive for redeem");

    const wallet = await this.getOrCreateWallet(clerkId);
    if (wallet.total_points < points) {
      throw new Error("Insufficient points");
    }

    wallet.total_points -= points;
    wallet.updated_at = new Date();
    await wallet.save();

    const tx = await LoyaltyTransaction.create({
      clerkId,
      type: "redeem",
      points: -points,
      balanceAfter: wallet.total_points,
      reason,
      sourceRef,
      performedBy,
      metadata,
    });

    return { wallet, transaction: tx };
  }

  async adjustPoints({ clerkId, points, reason, performedBy, metadata }) {
    if (!points) throw new Error("points must be non-zero for adjust");
    const wallet = await this.getOrCreateWallet(clerkId);
    wallet.total_points += points;
    if (wallet.total_points < 0) wallet.total_points = 0;
    wallet.updated_at = new Date();
    await wallet.save();

    const tx = await LoyaltyTransaction.create({
      clerkId,
      type: "adjust",
      points,
      balanceAfter: wallet.total_points,
      reason,
      performedBy,
      metadata,
    });

    return { wallet, transaction: tx };
  }

  async awardFromInvoice(invoiceId, clerkId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (!clerkId) throw new Error("Missing clerkId");

    const points = invoice.loyalty_points_earned ?? 0;
    if (points <= 0) return null;

    return this.awardPoints({
      clerkId,
      points,
      reason: `Award from invoice ${invoice.invoiceNumber}`,
      sourceRef: { kind: "invoice", refId: invoice._id },
      metadata: { invoiceId: invoice._id, amount: invoice.amount },
    });
  }
}

module.exports = {
  LoyaltyService: new LoyaltyService(),
};
