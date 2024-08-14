const mongoose = require('mongoose');
const validator = require('validator');

const clientScheme = new mongoose.Schema({
    client_id: {
        type: String,
        required: true,
        unique: true,
    },
    first_name: {
        type: String,
        trim: true,
        required: [true, "Your first name is required"],
    },
    last_name: {
        type: String,
        trim: true,
        required: [true, "Your last name is required"],
    },
    suffix: {
        type: String,
        trim: true,
    },
    plan: {
        type: String,
        enum: planEnum,
        default: null
    },
    birthday: {
        type: String,
        required: [true, "Your birthday is required"]
    },
    gender: {
        type: String,
        required: [true, "Your gender is required"],
    },
    email: {
        type: String,
        trim: true,
        required: [true, "Email is required"],
        unique: true,
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    phone_number: {
        type: String,
        required: [true, "Your phone number is required"],
    },
    address: {
        type: String,
        required: [true, "Your address is required"],
    },
    city: {
        type: String,
        required: [true, "Your city is required"],
    },
    state: {
        type: String,
        required: [true, "Your State is Required"]
    },
    zip: {
        type: String,
        required: [true, "Your zip code is required"],
    },
},
    {
        timestamps: true,
    })

module.exports = mongoose.model("Client", clientScheme);