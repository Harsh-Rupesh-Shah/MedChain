import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  type: {
    type: String,
    enum: ['prescription', 'lab_result', 'diagnosis', 'vaccination', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false
  },
  description: String,
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default medicalRecordSchema;