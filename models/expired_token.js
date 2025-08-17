const mongoose = require("mongoose");

const expiredTokenSchema = new mongoose.Schema({
  fullName: String,
  phoneNumber: String,
  serialNumber: Number,
  timestamp: Date,
  status: { type: String, default: "expired" },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  expiredAt: { type: Date, default: Date.now },
  originalCreatedAt: Date
});

module.exports = mongoose.model("ExpiredToken", expiredTokenSchema);
