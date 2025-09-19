module.exports.logApi = (req, res) => {
  res.on("finish", () => {
    console.log(
      "API: " +
        req.originalUrl +
        ", method: " +
        req.method +
        ", status: " +
        res.statusCode
    );
  });
};
