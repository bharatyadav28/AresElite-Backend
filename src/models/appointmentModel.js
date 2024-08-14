const mongoose = require("mongoose");
const paymentStatus = ["paid", "pending", "failed"];
const appointmentStatus = ["completed", "upcoming", "cancelled"];
const appointmentSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: String,
      required: true,
      unique: true,
    },
    service_type: {
      type: String,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'User'
    },
    app_date: {
      type: String,
      required: true,
    },
    app_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    doctor_trainer: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: paymentStatus,
      default: 'N.A.'
    },
    amount: {
      type: Number,
    },
    service_status: {
      type: String,
      required: true,
      enum: appointmentStatus,
      default: 'upcoming'
    }
  },
  {
    timestamps: true,
  }
);

appointmentSchema.pre('find', async function (next) {

  this.populate('client');
  next();
});

module.exports = mongoose.model("appointment", appointmentSchema);
