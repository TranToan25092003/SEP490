const { Schema, model } = require("mongoose");

const TestSchema = new Schema(
  {
    test: {
      type: String,
    },
  },

  { timestamps: true }
);

const Test = model("test", TestSchema);

module.exports = Test;
