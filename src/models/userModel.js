const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { max } = require("moment");

const roleEnum = ["admin", "doctor", "athlete"];
const paymentStatus = ["paid", "pending", "failed", "N.A."];
const modeStatus = ["N.A.", "online", "offline"];

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  profilePic: {
    type: String,
    trim: true,
    default: "https://icon-library.com/images/icon-user/icon-user-15.jpg",
  },
  prefix: {
    type: String,
    trim: true,
    default: "Mr",
  },
  email: {
    type: String,
    trim: true,
    required: [true, "Email is required"],
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  city: {
    type: String,
    trim: true,
  },
  zip: {
    type: Number,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  dob: {
    type: String,
  },
  gender: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    trim: true,
    default: true,
  },
  // Plan and Phase Information
  plan: {
    type: String, // Store the name of the selected plan
    default: null,
  },
  phase: {
    type: String, // Store the current phase of the plan
    default: null,
  },
  plan_payment: {
    type: String,
    enum: paymentStatus,
    default: "N.A.",
  },
  // Payment-related fields
  stripeSubscriptionId: {
    type: String, // To manage the subscription in Stripe
    default: null,
  },
  stripeCustomerId: {
    type: String, // To store the user's payment method from Stripe
    default: null,
  },
  mode: {
    type: String,
    enum: modeStatus,
    default: "N.A.",
  },
  password: {
    type: String,
    trim: true,
    required: [true, "Password is required"],
    minlength: [8, "Password should have a minimum of 8 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: roleEnum,
    default: "athlete",
  },
  is_online: {
    type: Boolean,
    default: true,
    required: true,
  },
  temp_code: {
    type: String,
  },
});

// Pre-save hook for password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWT token generation method
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRE,
  });
};

module.exports = mongoose.model("User", userSchema);
