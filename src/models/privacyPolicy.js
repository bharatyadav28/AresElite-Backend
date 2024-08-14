const mongoose = require('mongoose');
const roleEnum = ["doctor", "athleteOnline", "athleteOffline"];
const privacyPolicy = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: roleEnum
    }
}, { timestamps: true });

module.exports = mongoose.model("privacyPolicy", privacyPolicy);
