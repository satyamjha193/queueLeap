const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
    sectorname:{
    type:String,
    required:true,
  },
  shopname:{
    type:String,
    required:true,
  },
  shopaddress: {
     type: String,
      required: true
  },
   phone: { 
    type: String,
    unique: true,
    required: true,
    match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
    sparse: true    // sparse to ignore docs without phone or phone=null
  },
  shopImage: {
    type: String, // path to uploaded image
    required: true
  },
  email: { 
    type: String,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    sparse: true // add sparse if email can be empty, else remove if always required
  },

  password: {
    type: String
  },  
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  specialist:{
    type: String,
  },

  estimatedWaitTime: {
    type: String
  },

  estimatedWaitTimeRange: {
  type: String,
  required: true
},

  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    report: { type: Boolean, default: true }
  },
  twoFAEnabled: { type: Boolean, default: false },

  // admin dp
  profilePic: {
    type: String, // filename stored by multer
    default: null
  },


  
  // To store queue users data.
  queue: [
  {
    fullName: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'] // adjust as needed
    },
    serialNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["waiting", "called", "done"],
      default: "waiting"
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
]

});

module.exports = mongoose.model('Admin', adminSchema);
