var mongoose = require('mongoose')
const { Schema, model } = require("mongoose");
const validator = require("validator")
   

const sendEnquiry = new Schema(
  {
    agent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
    },
    massage: {
      type: String,
      require: true,
    },
    firstname: {
      type: String,
      // required: true
    },
    lastname: {
      type: String,
      // required: true
    },
    email: {      
      type: String,      
      required: true,      
      unique: true,      
      trim: true,      
      lowercase: true,      
    },      
    phoneNumber: {      
      type: Number,                                                                                                                
      trim: true,      
    },      
    isVerified: {      
      type: Boolean,      
      required: [true, "Required"],      
      default: false,      
    },      
    status: {      
      type: Boolean,      
      default: true,      
    },      
    role: {      
      type: String,      
      default: "user",      
      trim: true,      
    },      
  },      
  { timestamps: true, versionKey: false }      
);
module.exports = mongoose.model('sendEnquiry', sendEnquiry) 
