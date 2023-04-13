var mongoose = require('mongoose')
const { Schema, model } = require("mongoose");
const validator = require("validator");


const propertydetails = new Schema({
    timeframe: {
        type: String,
        required : true   
    },
    address: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        trim: true,
    },
    priceRange: {
        min: {
            type: Number,
            require : true,
        },
        max: {
            type: Number,
            require : true,
        }
    },
    remember_details: {
        type: Boolean,
        default : false
     },
    isVerified: {
        type: Boolean,
        required: [true, "Required"],
        default: false,
    },
    status: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        default: 'property',
        trim: true
    },
    

}, { timestamps: true, versionKey: false })
module.exports = mongoose.model('sendPropertydetails', propertydetails)
