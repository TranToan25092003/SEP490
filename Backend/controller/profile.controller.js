const { Vehicle } = require("../model");
const { ModelVehicle } = require("../model");

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

  let model = await ModelVehicle.findOne({ name, brand });

  if (!model) {
    model = await ModelVehicle.create({
      name,
      brand,
      year,
      engine_type,
      description,
    });
  }

  const existingVehicle = await Vehicle.findOne({ license_plate });
  if (existingVehicle) {
    return res
      .status(400)
      .json({ message: "Biển số xe đã tồn tại trong hệ thống." });
  }

  // 4️⃣ Tạo mới vehicle
  const vehicle = await Vehicle.create({
    OwnerClerkId,
    model_id: model._id,
    license_plate,
    year,
    odo_reading,
    images: image ? [image] : [],
  });

  // 5️⃣ Trả về kết quả
  return res.status(201).json({
    message: "Tạo phương tiện thành công!",
    vehicle,
    model,
  });
};

module.exports.getModels = async (req, res) => {
  const name = await ModelVehicle.find({}).select("name");

  const brand = await ModelVehicle.distinct("brand");
  res.status(200).json({
    message: "hello",
    data: {
      name,
      brand,
    },
  });
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
      .select("_id license_plate model_id images license_plate year");

    if (!vehicles.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe nào cho người dùng này",
      });
    }

    // Format lại dữ liệu gọn gàng
    const formatted = vehicles.map((v) => ({
      _id: v._id,
      name: v?.model_id?.name,
      brand: v.model_id?.brand || "Không rõ",
      engine_type: v.model_id?.engine_type || "Không rõ",
      description: v.model_id?.description || "",
      image: v?.images?.[0] || null,
      license_plate: v.license_plate,
      year: v.year,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách xe" });
  }
};
