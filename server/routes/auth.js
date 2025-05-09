import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User, Doctor, Patient } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyFace } from '../utils/faceRecognition.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for doctor ID uploads
const doctorIdStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/doctor-ids');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Configure multer for face image uploads
const faceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/faces');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const uploadDoctorId = multer({ 
  storage: doctorIdStorage,
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

const uploadFace = multer({ 
  storage: faceStorage,
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
router.post('/patient/register', uploadFace.single('biometricData'), async (req, res) => {
  try {
    const { email, password, name, ...profileData } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const newUser = new User({
      email,
      password,
      role: 'patient',
      verificationStatus: 'approved',
      isVerified: true
    });

    // Create patient profile
    const profile = new Patient({
      user: newUser._id,
      name,
      ...profileData
    });

    // Save face image if provided
    if (req.file) {
      profile.biometricData = {
        image: `/uploads/faces/${req.file.filename}`
      };
    }

    await profile.save();
    newUser.profile = profile._id;
    await newUser.save();

    res.status(201).json({
      message: 'Patient registered successfully',
      user: {
        email: newUser.email,
        name: profile.name,
        role: 'patient'
      }
    });
  } catch (err) {
    console.error('Patient registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Doctor Registration
router.post('/doctor/register',
  uploadDoctorId.single('idCardImage'),
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

// Face Login
router.post('/patient/face-login', uploadFace.single('face'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Face image is required' });
    }

    const user = await User.findOne({ email: req.body.email, role: 'patient' });
    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patient = await Patient.findOne({ user: user._id });
    if (!patient?.biometricData?.image) {
      return res.status(404).json({ message: 'No face data found for this patient' });
    }

    // Convert stored path to absolute path
    let storedImagePath = patient.biometricData.image;
    if (storedImagePath.startsWith('/')) {
      storedImagePath = storedImagePath.substring(1);
    }
    storedImagePath = path.join(__dirname, '..', storedImagePath);

    console.log('File existence check:');
    console.log('Uploaded:', fs.existsSync(req.file.path));
    console.log('Stored:', fs.existsSync(storedImagePath));

    const faceMatch = await verifyFace(req.file.path, storedImagePath);

    if (!faceMatch) {
      return res.status(401).json({ message: 'Face recognition failed' });
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
// Admin Login
router.post('/admin/login',
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

      // Check if it's the admin email
      if (email !== 'hrsshah04022004@gmail.com') {
        return res.status(401).json({ message: 'Not authorized as admin' });
      }

      // For the demo, use a hardcoded password check
      if (password !== 'Moon@11light') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create a stable admin ID
      const adminId = 'admin-' + Buffer.from(email).toString('hex');

      // Generate token with stable ID
      const token = jwt.sign(
        { 
          userId: adminId,
          role: 'admin',
          email: email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send response with consistent user object structure
      res.json({
        token,
        user: {
          _id: adminId,
          email: email,
          role: 'admin',
          name: 'Admin'
        }
      });
    } catch (err) {
      console.error('Admin login error:', err);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({
        _id: req.user.userId,
        email: req.user.email,
        role: 'admin',
        name: 'Admin'
      });
    }

    const user = await User.findById(req.user.userId)
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get profile data based on role
    let profile;
    if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id });
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: profile?.name,
      profile: profile
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;