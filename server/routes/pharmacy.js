import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Product } from '../models/index.js';

const router = express.Router();

// Get all products
router.get('/products', async (req, res) => {
  try {
    const { category, search, requiresPrescription } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (requiresPrescription !== undefined) {
      query.requiresPrescription = requiresPrescription === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check prescription requirement
router.post('/check-prescription', auth, async (req, res) => {
  try {
    const { productIds } = req.body;
    const products = await Product.find({ _id: { $in: productIds } });
    
    const requiresPrescription = products.some(p => p.requiresPrescription);
    res.json({ requiresPrescription });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;