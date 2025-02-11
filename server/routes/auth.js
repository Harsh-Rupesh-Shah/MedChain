import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Doctor, Patient } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['patient', 'doctor']).withMessage('Invalid role specified'),
    body('name').notEmpty().withMessage('Name is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: errors.array() 
        });
      }

      const { email, password, role, name, ...profileData } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user
      user = new User({
        email,
        password,
        role
      });

      // Create profile based on role
      let profile;
      if (role === 'doctor') {
        profile = new Doctor({
          user: user._id,
          name,
          ...profileData
        });
      } else {
        profile = new Patient({
          user: user._id,
          name,
          ...profileData
        });
      }

      // Save profile and user
      await profile.save();
      user.profile = profile._id;
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          name: profile.name
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Find user and populate profile
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Get profile based on role
      let profile;
      if (user.role === 'doctor') {
        profile = await Doctor.findOne({ user: user._id });
      } else {
        profile = await Patient.findOne({ user: user._id });
      }

      if (!profile) {
        return res.status(400).json({ message: 'Profile not found' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          name: profile.name
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get profile based on role
    let profile;
    if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    } else {
      profile = await Patient.findOne({ user: user._id });
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: profile.name,
      profile
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error while fetching user data' });
  }
});

export default router;