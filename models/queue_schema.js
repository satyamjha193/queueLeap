const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  currentTokenNumber: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Queue', QueueSchema);
