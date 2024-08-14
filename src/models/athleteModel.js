const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const roleEnum = ["admin", "doctor", "athlete"];
const athleteSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: [true, "Your first name is required"],
  },
  lastName: {
    type: String,
    trim: true,
    required: [true, "Your last name is required"],
  },
  email: {
    type: String,
    trim: true,
    required: [true, "Email is required"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  city: {
    type: String,
    trim: true,
    required: [true, "Your city is required"],
  },
  phone: {
    type: String,
    trim: true,
    required: [true, "Your phone is required"],
  },
  state: {
    type: String,
    trim: true,
    required: [true, "Your phone is required"],
  },
  age: {
    type: Number,
    required: [true, "Your age is required"],
  },
  dob: {
    type: String,
    required: [true, "Your age is required"],
  },
  gender: {
    type: String,
    required: [true, "gender is required"],
    default: "Right",
  },
  height: {
    type: String,
    required: [true, "Height is required"],
  },
  dominatedHand: {
    type: String,
    required: true,
  },
  guardianFirstName: {
    type: String,
    required: true,
  },
  guardianLastName: {
    type: String,
    required: true,
  },
  guardianSuffix: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    trim: true,
    required: [true, "Password is required"],
    minLength: [8, "Password should have minimum 8 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: roleEnum,
    default: "athlete",
  },
  temp_code: {
    type: String,
  },
});

athleteSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

athleteSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

athleteSchema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRE,
  });
};

module.exports = mongoose.model("Athlete", athleteSchema);
