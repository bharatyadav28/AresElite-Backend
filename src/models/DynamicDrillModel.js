const mongoose = require("mongoose");
const CamelcaseString = require("../utils/CamelcaseString");

// schema 1

const valuesSchema = new mongoose.Schema({
  value: String,
});

const columnsSchema = new mongoose.Schema({
  columnName: String,
  values: [valuesSchema],
  alias: { type: String },
});

columnsSchema.pre("save", async function (next) {
  this.alias = CamelcaseString(this.columnName);

  next();
});

// schema 2

const inputSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["multipleChoice", "text", "checkBox"],
  },
  label: { type: String, required: true },
  options: [String],
  alias: { type: String },
});

const dynamicDrillSchema = new mongoose.Schema({
  drillName: {
    type: String,
    required: true,
    unique: true,
  },
  inputs: [inputSchema],
});

// modals
const DynamicDrillColumns = mongoose.model(
  "DynamicDrillColumns",
  columnsSchema
);
const DynamicDrill = mongoose.model("DynamicDrill", dynamicDrillSchema);

module.exports = { DynamicDrill, DynamicDrillColumns };
