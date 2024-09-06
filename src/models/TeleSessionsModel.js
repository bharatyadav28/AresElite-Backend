const mongoose = require("mongoose");

const TeleSessionsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const TeleSessionsModel = mongoose.model("TeleSession", TeleSessionsSchema);
module.exports = TeleSessionsModel;
