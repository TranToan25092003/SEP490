const { validationResult } = require("express-validator");

module.exports.throwErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessage = errors
      .array()
      .map((err) => `${err.path}: ${err.msg}`)
      .join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
};
