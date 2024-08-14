const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
    session_type: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    sessions: {
        type: Number,
        required: true,
        min: 1
    },
    frequency: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('TrainingSessionModel', trainingSessionSchema);
