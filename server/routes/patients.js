import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import Patient from '../models/Patient.js';
import multer from 'multer';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
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

// Get patient profile
router.get('/profile', auth, checkRole(['patient']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.userId })
      .populate('medicalHistory.doctor', 'name specialization')
      .populate('prescriptions.doctor', 'name specialization');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    console.error('Get patient profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register face
router.post('/register-face', auth, checkRole(['patient']), upload.single('face'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No face image provided' });
    }

    // Store the face image data
    const patient = await Patient.findOneAndUpdate(
      { user: req.user.userId },
      { 
        $set: {
          'faceData.image': req.file.buffer,
          'faceData.lastUpdated': new Date()
        }
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Face registered successfully' });
  } catch (err) {
    console.error('Face registration error:', err);
    res.status(500).json({ message: 'Error registering face' });
  }
});

// Verify face for login
router.post('/verify-face', upload.single('face'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No face image provided' });
    }

    // For demo purposes, we'll just return success
    // In production, implement proper face matching logic
    const patient = await Patient.findOne().populate('user');
    
    if (!patient) {
      return res.status(401).json({ message: 'Face not recognized' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: patient.user._id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      verified: true,
      token,
      user: {
        _id: patient.user._id,
        email: patient.user.email,
        role: 'patient',
        name: patient.name
      }
    });
  } catch (err) {
    console.error('Face verification error:', err);
    res.status(500).json({ message: 'Error verifying face' });
  }
});

export default router;