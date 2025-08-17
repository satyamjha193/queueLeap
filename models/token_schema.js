const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  fullName: String,
  phoneNumber: { type: String, required: true },
  serialNumber: Number,
  timestamp: Date,
  status: { type: String, enum: ['waiting', 'served', 'skipped'], default: 'waiting' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now }
});



// ✅ Index to optimize queries filtering by admin and date
tokenSchema.index({ adminId: 1, createdAt: 1 });
module.exports = mongoose.model("Token", tokenSchema);
