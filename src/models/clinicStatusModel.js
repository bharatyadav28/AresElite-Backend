const mongoose = require('mongoose');

const statusSchema = mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    clinicName: {
        type: String,
        required: true
    },
    isActiveStatus: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.model("clinicStatus", statusSchema);