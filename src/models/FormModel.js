const mongoose = require("mongoose");

const EvalForm = new mongoose.Schema({
    name: {
        type: String,
    },
    obj: {
        type: Array,
    },
})

const Eval = mongoose.model('Form', EvalForm);

module.exports = Eval;