const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentsEnum = ["pending", "paid", "failed"];

const transactionSchema = new Schema(
  {
    doctor: {
      type: String,
    },
    service_type: {
      type: String,
    },
    plan: {
      type: String,
    },
    phase: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
      enum: paymentsEnum,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    bookingId: {
      type: Schema.Types.ObjectId,
    },
    amount: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
    },
    plan: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("transaction", transactionSchema);
