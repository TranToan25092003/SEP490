const ModelVehicle = require("../model/vehicle_model.model");

// this controller is for testing do not write any logic code here please
module.exports.checkHealth = async (req, res) => {
  console.log(req.user.id);

  res.status(200).json({
    message: "System is healthy",
  });
};
// ------------------------------------------------------------

module.exports.createVehicle = async (req, res) => {
  res.status(200).json({
    message: "hello",
  });
};

module.exports.getModels = async (req, res) => {
  const data = await ModelVehicle.find({});
  res.status(200).json({
    message: "hello",
    data,
  });
};
