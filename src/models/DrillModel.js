const mongoose = require('mongoose');

const file = new mongoose.Schema({
    link: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
})

const activity = new mongoose.Schema({
    activityName: {
        type: String
    },
    description: {
        type: String
    },
    fileLinks: {
        type: Array,
        of: file
    },
    form: {
        type: Array
    },
    isComplete: {
        type: Boolean,
        required: true,
        default: false
    }
});

const drillSchema = new mongoose.Schema({
    plan: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        required: true
    },
    week: {
        type: String,
        required: true
    },
    day: {
        type: String,
        required: true
    },
    activities: [activity]
});

module.exports = mongoose.model("drillForm", drillSchema);