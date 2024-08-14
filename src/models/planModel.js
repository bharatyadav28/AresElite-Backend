const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    }
});

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phases: [phaseSchema],
    features: {
        type: Array,
        required: true
    }
});


module.exports = mongoose.model("plan", planSchema);
