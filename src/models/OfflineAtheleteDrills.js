const mongoose = require("mongoose");

const SessionDataSchema = new mongoose.Schema({
  drill: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please provide dynamic drill id"],
    ref: "DynamicDrill",
  },

  inputValues: [Object],
  columnValues: [Object],
  isComplete: {
    type: Boolean,
    default: false,
  },
});

const SessionsSchema = new mongoose.Schema({
  sessionNumber: {
    type: Number,
    default: 1,
  },
  data: [SessionDataSchema],
  isBooked: {
    type: Boolean,
    default: false,
  },
});

const OfflineAtheleteDrillsSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide client id"],
      ref: "User",
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide appointment id"],
      ref: "appointment",
    },

    serviceType: {
      type: String,
    },
    sessions: [SessionsSchema],
  },
  { timestamps: true }
);

const OfflineAtheleteDrillsModel = mongoose.model(
  "OfflineAtheleteDrills",
  OfflineAtheleteDrillsSchema
);

module.exports = OfflineAtheleteDrillsModel;
