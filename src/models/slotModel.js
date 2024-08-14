const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    doctor: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("slot", slotSchema);
