const express = require("express");
const router = express.Router();
const { clerkClient } = require("../../config/clerk");

// Update a staff member's public metadata in Clerk
router.patch("/:clerkUserId/public-metadata", async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const { publicMetadata } = req.body || {};

    if (!clerkUserId) {
      return res.status(400).json({ message: "Missing clerkUserId" });
    }

    if (!publicMetadata || typeof publicMetadata !== "object" || Array.isArray(publicMetadata)) {
      return res.status(400).json({ message: "publicMetadata must be an object" });
    }

    const allowedFields = ["phone", "gender", "address", "fullName"];
    const sanitized = {};

    allowedFields.forEach((field) => {
      if (publicMetadata[field] !== undefined) {
        const value = publicMetadata[field];
        sanitized[field] = typeof value === "string" ? value.trim() : value;
      }
    });

    const existing = await clerkClient.users.getUser(clerkUserId);
    const existingMeta = existing?.publicMetadata || {};

    const updated = await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: {
        ...existingMeta,
        ...sanitized,
      },
    });

    return res.status(200).json({
      message: "Public metadata updated successfully",
      data: { publicMetadata: updated.publicMetadata },
    });
  } catch (error) {
    console.error("Failed to update public metadata for staff:", error);
    return res.status(500).json({ message: "Failed to update public metadata" });
  }
});

module.exports = router;
