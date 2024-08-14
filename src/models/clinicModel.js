const mongoose = require('mongoose')

const clinicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        trim: true,
    },
    endTime: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        trim: true,
        default: true
    },
})
module.exports = mongoose.model('clinic', clinicSchema)
