const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const drillSchema = new mongoose.Schema({
    clientId: {
        type: ObjectId,
    },
    drill: {
        type: Object,
        required: true
    }
})

module.exports = mongoose.model("drill", drillSchema);