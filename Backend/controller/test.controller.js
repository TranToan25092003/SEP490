// this controller is for testing do not write any logic code here please
module.exports.checkHealth = async (req, res) => {
  console.log(req.user.id);

  res.status(200).json({
    message: "System is healthy",
  });
};
// ------------------------------------------------------------
