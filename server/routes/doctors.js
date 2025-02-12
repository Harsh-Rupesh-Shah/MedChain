import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Doctor, Patient, User, Appointment } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file upload
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

// Get all patients for doctor
router.get('/patients', auth, checkRole(['doctor']), async (req, res) => {
  try {
    // Find all users with role 'patient'
    const patientUsers = await User.find({ role: 'patient' });
    
    // Get patient profiles
    const patients = await Patient.find({
      user: { $in: patientUsers.map(u => u._id) }
    }).populate('user', 'email');

    // Get doctor's ID
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Enhance patient data with appointment information
    const enhancedPatients = await Promise.all(patients.map(async (patient) => {
      // Get the latest appointment
      const latestAppointment = await Appointment.findOne({
        doctor: doctor._id,
        patient: patient._id
      }).sort({ date: -1 });

      // Get upcoming appointment
      const upcomingAppointment = await Appointment.findOne({
        doctor: doctor._id,
        patient: patient._id,
        date: { $gt: new Date() },
        status: 'scheduled'
      }).sort({ date: 1 });

      return {
        _id: patient._id,
        name: patient.name,
        email: patient.user.email,
        phone: patient.phone || 'Not provided',
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender || 'Not specified',
        bloodGroup: patient.bloodGroup || 'Not specified',
        lastVisit: latestAppointment ? latestAppointment.date : null,
        upcomingAppointment: upcomingAppointment ? {
          date: upcomingAppointment.date,
          time: `${upcomingAppointment.timeSlot.startTime} - ${upcomingAppointment.timeSlot.endTime}`
        } : null
      };
    }));

    res.json(enhancedPatients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// Verify doctor ID card
router.post('/verify-id', upload.single('idCard'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No ID card image provided' });
    }

    // For development/testing, return success
    // In production, implement actual OCR verification
    const doctorId = 'DOC-' + Math.random().toString(36).substr(2, 9);

    res.json({
      verified: true,
      doctorId,
      message: 'ID verification successful'
    });
  } catch (err) {
    console.error('ID verification error:', err);
    res.status(500).json({ 
      message: err.message || 'Error verifying ID card',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'email name')
      .select('-__v');
    res.json(doctors);
  } catch (err) {
    console.error('Get doctors error:', err);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'email')
      .select('-__v');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (err) {
    console.error('Get doctor error:', err);
    res.status(500).json({ message: 'Error fetching doctor details' });
  }
});

// Update doctor availability
router.put('/availability', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.userId },
      { $set: { availability: req.body.availability } },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (err) {
    console.error('Update availability error:', err);
    res.status(500).json({ message: 'Error updating availability' });
  }
});

export default router;