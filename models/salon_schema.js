// models/salon_schema.js
const mongoose = require("mongoose");

const salonSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  name: { type: String, required: true },
  sectorname: { type: String, required: true },
  shopname: { type: String, required: true },
  shopaddress: { type: String, required: true },
  phone: { type: String, required: true },
  specialist: { type: String }, 

  shopImage: { type: String, required: true },

  estimatedWaitTime: { type: String, default: 5 },

  isOpen: { type: Boolean, default: false },

  tokens: [
    {
      fullName: String,
      phoneNumber: String,
      serialNumber: Number,
      timestamp: Date,
      status: {
        type: String,
        enum: ['waiting', 'served', 'skipped', 'completed'],
        default: 'waiting'
      }
    }
  ],

  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  locationMapUrl: { type: String, required: true }
});

module.exports = mongoose.model("Salon", salonSchema);
