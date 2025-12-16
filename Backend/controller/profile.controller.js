const { Vehicle } = require("../model");
const { ModelVehicle } = require("../model");
const { clerkClient } = require("../config/clerk");
const { logActivity } = require("./activityLog.controller");

// this controller is for testing do not write any logic code here please
module.exports.checkHealth = async (req, res) => {
  console.log(req.user.id);

  res.status(200).json({
    message: "System is healthy",
  });
};
// ------------------------------------------------------------

module.exports.createVehicle = async (req, res) => {
  console.log(req.body);

  const {
    name,
    brand,
    license_plate,
    year,
    engine_type,
    description,
    odo_reading,
    image,
  } = req.body;

  const OwnerClerkId = req.userId;

  // Normalize: trim whitespace
  const normalizedName = name?.trim();
  const normalizedBrand = brand?.trim();

  if (!normalizedName || !normalizedBrand) {
    return res.status(400).json({
      message: "Tên xe và hãng xe là bắt buộc",
    });
  }

  // Escape special regex characters để tránh lỗi
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Tìm model với case-insensitive (sử dụng regex an toàn)
  let model = await ModelVehicle.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(normalizedName)}$`, "i") },
    brand: { $regex: new RegExp(`^${escapeRegex(normalizedBrand)}$`, "i") },
  });

  if (!model) {
    // Tạo mới model với dữ liệu đã normalize
    model = await ModelVehicle.create({
      name: normalizedName,
      brand: normalizedBrand,
      year,
      engine_type,
      description,
    });
  }

  // Normalize biển số: trim và uppercase để check case-insensitive
  const normalizedLicensePlate = license_plate?.trim().toUpperCase();

  if (!normalizedLicensePlate) {
    return res.status(400).json({
      message: "Biển số xe là bắt buộc",
    });
  }

  // Check trùng biển số (case-insensitive)
  const existingVehicle = await Vehicle.findOne({
    license_plate: {
      $regex: new RegExp(
        `^${normalizedLicensePlate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      ),
    },
  });

  if (existingVehicle) {
    return res
      .status(400)
      .json({ message: "Biển số xe đã tồn tại trong hệ thống." });
  }

  const vehicle = await Vehicle.create({
    OwnerClerkId,
    model_id: model._id,
    license_plate: normalizedLicensePlate, // Lưu biển số đã normalize
    year,
    odo_reading,
    images: image ? [image] : [],
  });

  await logActivity({
    actorClerkId: req.userId,
    actorEmail: req.user?.emailAddresses?.[0]?.emailAddress,
    actorName: req.user?.fullName,
    action: "vehicle.create",
    targetType: "Vehicle",
    targetId: vehicle._id,
    description: `Tạo vehicle #${vehicle._id}`,
    metadata: {},
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(201).json({
    message: "Tạo phương tiện thành công!",
    vehicle,
    model,
  });
};

module.exports.getModels = async (req, res) => {
  const brand = req.query.brand;

  if (brand) {
    // Lấy danh sách models (name) theo brand
    const models = await ModelVehicle.find({
      brand: {
        $regex: new RegExp(
          `^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
      status: "active",
    })
      .distinct("name")
      .lean();

    res.status(200).json({
      message: "hello",
      data: {
        models: models || [],
      },
    });
  } else {
    // Lấy danh sách brands
    const brands = await ModelVehicle.distinct("brand", { status: "active" });
    res.status(200).json({
      message: "hello",
      data: {
        brand: brands,
      },
    });
  }
};

module.exports.getVehicles = async (req, res) => {
  try {
    const clerkId = req.userId;

    const vehicles = await Vehicle.find({ OwnerClerkId: clerkId })
      .populate({
        path: "model_id",
        model: "ModelVehicle",
        select: "brand engine_type description year name",
      })
      .select("_id license_plate model_id images license_plate year")
      .lean(); // Tối ưu: sử dụng lean() để tăng performance

    if (!vehicles.length) {
      return res.status(200).json({
        success: false,
        message: "Không tìm thấy xe nào cho người dùng này",
      });
    }

    const hiddenVehicleIdsRaw =
      req.user?.publicMetadata?.hiddenVehicleIds || [];
    const hiddenVehicleIds = Array.isArray(hiddenVehicleIdsRaw)
      ? hiddenVehicleIdsRaw.map((id) => id.toString())
      : [];

    // Format lại dữ liệu gọn gàng và lọc những xe đã bị ẩn
    const formatted = vehicles
      .map((v) => ({
        _id: v._id,
        name: v?.model_id?.name,
        brand: v.model_id?.brand || "Không rõ",
        engine_type: v.model_id?.engine_type || "Không rõ",
        description: v.model_id?.description || "",
        images: v?.images || null,
        license_plate: v.license_plate,
        year: v.year,
      }))
      .filter((v) => !hiddenVehicleIds.includes(v._id.toString()));

    console.log(formatted);

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách xe" });
  }
};

module.exports.hideVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body || {};

    if (!vehicleId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu vehicleId" });
    }

    const vehicle = await Vehicle.findById(vehicleId)
      .select("_id OwnerClerkId")
      .lean();

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy xe" });
    }

    if (vehicle.OwnerClerkId !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền với xe này" });
    }

    const existingMeta = req.user?.publicMetadata || {};
    const existingHiddenRaw = existingMeta.hiddenVehicleIds || [];
    const existingHidden = Array.isArray(existingHiddenRaw)
      ? existingHiddenRaw.map((id) => id.toString())
      : [];

    if (!existingHidden.includes(vehicleId.toString())) {
      existingHidden.push(vehicleId.toString());
    }

    const updated = await clerkClient.users.updateUser(req.userId, {
      publicMetadata: {
        ...existingMeta,
        hiddenVehicleIds: existingHidden,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Đã ẩn xe khỏi hồ sơ khách hàng",
      data: {
        hiddenVehicleIds: updated.publicMetadata?.hiddenVehicleIds || [],
      },
    });
  } catch (error) {
    console.error("Failed to hide vehicle:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi ẩn xe khỏi hồ sơ" });
  }
};

module.exports.checkLicensePlate = async (req, res) => {
  try {
    const { license_plate } = req.query;

    if (!license_plate) {
      return res.status(400).json({
        success: false,
        message: "Thiếu biển số xe",
      });
    }

    // Normalize biển số: trim và uppercase
    const normalizedLicensePlate = license_plate.trim().toUpperCase();

    // Check trùng biển số (case-insensitive)
    const existingVehicle = await Vehicle.findOne({
      license_plate: {
        $regex: new RegExp(
          `^${normalizedLicensePlate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    }).lean();

    return res.status(200).json({
      success: true,
      available: !existingVehicle,
      message: existingVehicle
        ? "Biển số xe đã tồn tại trong hệ thống"
        : "Biển số xe có thể sử dụng",
    });
  } catch (error) {
    console.error("Error checking license plate:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra biển số xe",
    });
  }
};

module.exports.updatePublicMetadata = async (req, res) => {
  try {
    const payload = req.body?.publicMetadata;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res
        .status(400)
        .json({ message: "publicMetadata must be an object" });
    }

    const sanitized = Object.entries(payload).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {});

    const existing = req.user?.publicMetadata || {};

    const updated = await clerkClient.users.updateUser(req.userId, {
      publicMetadata: {
        ...existing,
        ...sanitized,
      },
    });

    res.status(200).json({
      message: "Public metadata updated successfully",
      data: { publicMetadata: updated.publicMetadata },
    });
  } catch (error) {
    console.error("Failed to update public metadata:", error);
    res.status(500).json({ message: "Failed to update public metadata" });
  }
};
