import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  idCardImage: {
    type: String,
    required: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    slots: [{
      startTime: String,
      endTime: String,
      isBooked: { type: Boolean, default: false }
    }]
  }],
  ratings: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    rating: Number,
    review: String,
    date: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0
  }
});

doctorSchema.index({ 'location.coordinates': '2dsphere' });

export default doctorSchema;