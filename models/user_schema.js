// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // May come from Google or be entered manually
    trim: true
  },

  // For email/password users
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true // Allows multiple nulls (used for phone-only users)
  },
  password: {
    type: String,
    required: function () {
      return this.authType === "email";
    }
  },

  // For phone + OTP users
  phone: {
    type: String,
    unique: true,
    sparse: true // Allows multiple nulls (used for email-only or Google users)
  },

  // For Google OAuth users
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  profilePic: {
    type: String, // Optional, if you want to store user's Google avatar
  },

  // Auth type helps identify the registration method
  authType: {
    type: String,
    enum: ["email", "phone", "google"],
    required: true
  },

  // Timestamps for audit
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Optional: Add index on createdAt for sorting
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
