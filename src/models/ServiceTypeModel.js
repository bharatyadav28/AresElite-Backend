const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    alias: {
        type: String,
    }
});

serviceSchema.pre("save", async function (next) {
    this.alias = this.name.replace(/\s/g, '');
    next();
});

module.exports = mongoose.model("service", serviceSchema);
