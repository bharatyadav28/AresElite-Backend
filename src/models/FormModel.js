const mongoose = require("mongoose");

const serviceTypeSchema = {
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "service",
  },
  obj: {
    type: Array,
  },
};

const EvalForm = new mongoose.Schema({
  name: {
    type: String,
  },
  serviceType: [serviceTypeSchema],
});
const Eval = mongoose.model("Form", EvalForm);

module.exports = Eval;
