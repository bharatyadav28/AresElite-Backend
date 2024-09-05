const mongoose = require("mongoose");

const BookingServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  alias: {
    type: String,
  },
});

BookingServiceSchema.pre("save", async function (next) {
  this.alias = this.name.replace(/\s/g, "");
  next();
});

module.exports = mongoose.model("BookingService", BookingServiceSchema);
