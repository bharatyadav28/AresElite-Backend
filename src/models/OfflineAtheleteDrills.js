const mongoose = require("mongoose");

const SessionDataSchema = new mongoose.Schema({
  drill: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please provide dynamic drill id"],
    ref: "DynamicDrill",
  },
  drillName: {
    type: String,
    required: [true, "Please provide drill name"],
  },

  inputValues: Object,
  columnValues: Object,
  isComplete: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
  },
});

const SessionsSchema = new mongoose.Schema({
  session: {
    type: String,
    required: ["true", "Session number cannot be empty"],
  },
  drills: [SessionDataSchema],
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
      // required: [true, "Please provide appointment id"],
      ref: "appointment",
    },

    serviceType: {
      type: String,
    },
    sessions: [SessionsSchema],
    numOfSessions: {
      type: Number,
      default: 1,
    },
    unPaidSessions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const OfflineAtheleteDrillsModel = mongoose.model(
  "OfflineAtheleteDrills",
  OfflineAtheleteDrillsSchema
);

module.exports = OfflineAtheleteDrillsModel;
