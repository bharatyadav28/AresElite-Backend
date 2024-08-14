const mongoose = require('mongoose')

const evalReqSchema = new mongoose.Schema({
    client: {
        type: Object,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    evalid: {
        type: String,
        required: true
    }
})
module.exports = mongoose.model('evaluationRequest', evalReqSchema)
