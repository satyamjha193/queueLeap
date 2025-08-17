const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: {
     type: String, 
     required: true 
    },
  address: { type: String,
     required: true 
    },
  geoCoordinates: {
    type: { type: String,
         enum: ['Point'], 
         default: 'Point'
          },
    coordinates: { type: [Number], 
        required: true 
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Location', LocationSchema);
