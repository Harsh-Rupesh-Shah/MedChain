import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true,
    enum: ['prescription', 'otc', 'equipment', 'wellness']
  },
  price: {
    type: Number,
    required: true
  },
  image: String,
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  manufacturer: String,
  dosageForm: String,
  strength: String,
  packSize: String,
  sideEffects: [String],
  warnings: [String]
});

export default mongoose.model('Product', productSchema);