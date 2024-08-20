const mongoose = require("mongoose");

const columnsSchema = new mongoose.Schema({
  columnName: String,
  values: Array,
});

const inputSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["multipleChoice", "text", "checkBox"],
  },
  label: { type: String, required: true },
  options: [String],
});

const dynamicDrillSchema = new mongoose.Schema({
  drillName: {
    type: String,
    required: true,
    unique: true,
  },
  inputs: [inputSchema],
});

const DynamicDrillColumns = mongoose.model(
  "DynamicDrillColumns",
  columnsSchema
);
const DynamicDrill = mongoose.model("DynamicDrill", dynamicDrillSchema);

module.exports = { DynamicDrill, DynamicDrillColumns };
