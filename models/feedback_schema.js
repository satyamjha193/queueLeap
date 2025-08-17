const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  category: { type: String },
  role: { type: String, enum: ["admin", "user", "guest"], required: true },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
