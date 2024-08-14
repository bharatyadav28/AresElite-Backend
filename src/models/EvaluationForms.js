const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;

const evalformSchema = new mongoose.Schema({
    appointmentId: {
        type: ObjectId,
        required: true,
    },
    form: {
        type: Array,
        required: true
    }
});

module.exports = mongoose.model("evalForm", evalformSchema);
