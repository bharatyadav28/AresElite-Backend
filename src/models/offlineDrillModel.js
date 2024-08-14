const mongoose = require('mongoose');

const formModel = new mongoose.Schema({
    label: { type: String, required: true },
    type_of_field: { type: String, required: true },
    options: { type: Array, required: true },
    value: { type: String, required: true }
});

const drillModel = new mongoose.Schema({
    label: { type: String, required: true },
    isComplete: { type: Boolean, required: true, default: false },
    form: { type: [formModel] }
}, { timestamps: true });

const sessionSchema = new mongoose.Schema({
    drills: { type: [drillModel] },
    isBooked: {
        type: Boolean, required: true, default: false
    }
});

const offlineDrillSchema = new mongoose.Schema({
    clientId: { type: mongoose.Types.ObjectId, required: true },
    sessions: { type: [sessionSchema], required: true }
});

const OfflineDrill = mongoose.model('OfflineDrill', offlineDrillSchema);

module.exports = OfflineDrill;