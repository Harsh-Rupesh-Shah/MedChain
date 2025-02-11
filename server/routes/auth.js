import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User, Doctor, Patient } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/doctor-ids';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'));
      return;
    }
    cb(null, true);
  }
});

// Patient Registration
router.post('/patient/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: errors.array() 
        });
      }

      const { email, password, name, ...profileData } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user
      user = new User({
        email,
        password,
        role: 'patient',
        verificationStatus: 'approved',
        isVerified: true
      });

      // Create patient profile
      const profile = new Patient({
        user: user._id,
        name,
        ...profileData
      });

      await profile.save();
      user.profile = profile._id;
      await user.save();

      res.status(201).json({
        message: 'Patient registered successfully',
        user: {
          email: user.email,
          name: profile.name,
          role: 'patient'
        }
      });
    } catch (err) {
      console.error('Patient registration error:', err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// Doctor Registration
router.post('/doctor/register',
  upload.single('idCardImage'),
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: errors.array() 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'ID card image is required' });
      }

      const { email, password, name, ...profileData } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user
      user = new User({
        email,
        password,
        role: 'doctor',
        verificationStatus: 'pending',
        isVerified: false
      });

      // Create doctor profile
      const profile = new Doctor({
        user: user._id,
        name,
        ...profileData,
        idCardImage: `/uploads/doctor-ids/${req.file.filename}`
      });

      await profile.save();
      user.profile = profile._id;
      await user.save();

      res.status(201).json({
        message: 'Doctor registration pending approval',
        user: {
          email: user.email,
          name: profile.name,
          role: 'doctor',
          verificationStatus: 'pending'
        }
      });
    } catch (err) {
      console.error('Doctor registration error:', err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// Patient Login
router.post('/patient/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Find user and check role
      const user = await User.findOne({ email, role: 'patient' });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Get patient profile
      const patient = await Patient.findOne({ user: user._id });
      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id, role: 'patient' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: 'patient',
          name: patient.name
        }
      });
    } catch (err) {
      console.error('Patient login error:', err);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Doctor Login
router.post('/doctor/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Find user and check role
      const user = await User.findOne({ email, role: 'doctor' });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check verification status
      if (!user.isVerified || user.verificationStatus !== 'approved') {
        return res.status(401).json({ 
          message: 'Your account is pending approval. Please wait for admin verification.',
          verificationStatus: user.verificationStatus
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Get doctor profile
      const doctor = await Doctor.findOne({ user: user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id, role: 'doctor' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: 'doctor',
          name: doctor.name,
          specialization: doctor.specialization
        }
      });
    } catch (err) {
      console.error('Doctor login error:', err);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Face Login (Patient only)
router.post('/patient/face-login', upload.single('face'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Face image is required' });
    }

    // Here you would implement actual face recognition logic
    // For now, we'll simulate with a basic check
    const user = await User.findOne({ role: 'patient', isVerified: true });
    if (!user) {
      return res.status(404).json({ message: 'No matching user found' });
    }

    const patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const token = jwt.sign(
      { userId: user._id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: 'patient',
        name: patient.name
      }
    });
  } catch (err) {
    console.error('Face login error:', err);
    res.status(500).json({ message: 'Face verification failed' });
  }
});

export default router;