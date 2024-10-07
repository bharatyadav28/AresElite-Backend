const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true, // Duration in months
    },
    cost: {
        type: Number,
        required: true, // Cost for this phase
    },
});

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Name of the plan (e.g., Novice, Intermediate)
    },
    phases: [phaseSchema], // Array of phases associated with the plan
    features: {
        type: [String], // Array of features offered by the plan
        required: true,
    },
    validity: {
        type: Number,
        required: true, // Plan validity in months
    },
    oneTimeCharge: {
        type: Boolean,
        default: false, // Set to true for one-time payment plans
    },
    recurring: {
        type: Boolean,
        default: true, // Set to true for recurring subscription plans
    },
});

module.exports = mongoose.model("Plan", planSchema);
