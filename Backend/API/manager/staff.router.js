const express = require("express");
const router = express.Router();
const { clerkClient } = require("../../config/clerk");

// Get a staff member's public metadata from Clerk
router.get("/:clerkUserId/public-metadata", async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    if (!clerkUserId) {
      return res.status(400).json({ message: "Missing clerkUserId" });
    }

    const user = await clerkClient.users.getUser(clerkUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const publicMetadata = user.publicMetadata || {};
    const primaryEmail = Array.isArray(user.emailAddresses)
      ? user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ||
        user.emailAddresses[0]
      : null;
    const primaryPhone = Array.isArray(user.phoneNumbers)
      ? user.phoneNumbers.find((p) => p.id === user.primaryPhoneNumberId) ||
        user.phoneNumbers[0]
      : null;

    const publicUserData = {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      emailAddress: primaryEmail?.emailAddress,
      phoneNumber: primaryPhone?.phoneNumber,
    };

    return res.status(200).json({ publicMetadata, publicUserData });
  } catch (error) {
    console.error("Failed to fetch public metadata for staff:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch public metadata" });
  }
});

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
