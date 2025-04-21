import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Doctor, Patient, User, Appointment, MedicalRecord } from '../models/index.js';
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

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select('name specialization');
    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Get doctor's available time slots
router.get('/:doctorId/slots', auth, async (req, res) => {
  try {
    const { date } = req.query;
    
    // Get doctor based on user ID if it's the doctor checking their own slots
    const doctorId = req.user.role === 'doctor' ? req.user.userId : req.params.doctorId;
    const doctor = await Doctor.findOne({ user: doctorId });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get day of week from date (0 = Sunday, 1 = Monday, etc.)
    const dayIndex = new Date(date).getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[dayIndex];
    
    // Get doctor's availability for that day
    const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);
    
    if (!dayAvailability) {
      return res.json({ slots: [] });
    }

    // Get existing appointments for that date
    const existingAppointments = await Appointment.find({
      doctor: doctor._id,
      date,
      status: 'scheduled'
    });

    // Filter out booked slots
    const availableSlots = dayAvailability.slots.filter(slot => {
      return !existingAppointments.some(apt => 
        apt.timeSlot.startTime === slot.startTime &&
        apt.timeSlot.endTime === slot.endTime
      );
    });

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all patients for a doctor
router.get('/patients', auth, checkRole(['doctor']), async (req, res) => {
  try {
    // First get all patients with their user data in a single query
    const patients = await Patient.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true // Keep patients even if no user found
        }
      }
    ]);

    // Get doctor's appointments for these patients
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointments = await Appointment.find({ doctor: doctor._id });

    // Enhance patient data with appointment information
    const enhancedPatients = patients.map(patient => {
      const patientAppointments = appointments.filter(apt => 
        apt.patient.toString() === patient._id.toString()
      );

      const lastVisit = patientAppointments
        .filter(apt => apt.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      const upcomingAppointment = patientAppointments
        .filter(apt => 
          apt.status === 'scheduled' && 
          new Date(apt.date) > new Date()
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

      return {
        _id: patient._id,
        name: patient.name,
        email: patient.userData?.email || 'Email not available',
        phone: patient.phone || 'Not provided',
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender || 'Not specified',
        bloodGroup: patient.bloodGroup || 'Not specified',
        lastVisit: lastVisit ? lastVisit.date : null,
        upcomingAppointment: upcomingAppointment ? {
          date: upcomingAppointment.date,
          time: `${upcomingAppointment.timeSlot.startTime} - ${upcomingAppointment.timeSlot.endTime}`
        } : null,
        hasHistory: patientAppointments.length > 0
      };
    });

    res.json(enhancedPatients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// Get patient's medical records
// Get doctor profile
router.get('/profile', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.userId })
      .populate('user', 'email');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ message: 'Error fetching doctor profile' });
  }
});

// Get patient's medical records
router.get('/patients/:patientId/records', auth, checkRole(['doctor']), async (req, res) => {
  try {
    console.log('Fetching records for patient:', req.params.patientId);

    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // First, get the Patient to retrieve the user ObjectId
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Now fetch records using patient's `user` ObjectId
    const records = await MedicalRecord.find({
      patient: patient.user
    })
    .populate('doctor', 'name')
    .populate('patient', 'name')
    .sort({ date: -1 });

    console.log('Found records:', records);

    res.json(records);
  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({ message: 'Server error' });
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

// Update doctor profile
router.put('/profile', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name',
      'specialization',
      'experience',
      'location',
      'availability',
      'phone', // Add phone to the allowed updates
      'address', // Add address to the allowed updates
      'dateOfBirth', // Add dateOfBirth to the allowed updates
      'gender', // Add gender to the allowed updates
      'bloodGroup', // Add bloodGroup to the allowed updates
      'allergies', // Add allergies to the allowed updates
      'chronicConditions', // Add chronicConditions to the allowed updates
      'emergencyContact' // Add emergencyContact to the allowed updates
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();

    // Return the updated doctor profile
    const updatedDoctor = await Doctor.findOne({ user: req.user.userId })
      .populate('user', 'email');

    res.json(updatedDoctor);
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ message: 'Error updating doctor profile' });
  }
});

export default router;