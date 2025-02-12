import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: String,
    url: String,
    name: String
  }],
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default messageSchema;