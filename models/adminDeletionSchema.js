const mongoose = require("mongoose");

const adminDeletionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  shopname: {
    type: String
  },
  sectorname: {
    type: String
  },
  reason: {
    type: String,
    enum: [
      "No longer needed",
      "Privacy concerns",
      "Too many notifications",
      "Other"
    ],
    required: true
  },
  deletedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("AdminDeletionLog", adminDeletionSchema);
