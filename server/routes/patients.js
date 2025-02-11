import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Patient, User, Appointment, MedicalRecord } from '../models/index.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/medical-records');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
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
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile
router.put('/profile', auth, checkRole(['patient']), async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      dateOfBirth,
      gender,
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContact
    } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { user: req.user.userId },
      {
        name,
        phone,
        address,
        dateOfBirth,
        gender,
        bloodGroup,
        allergies,
        chronicConditions,
        emergencyContact
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medical records
router.get('/records', auth, checkRole(['patient']), async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user.userId })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });
    
    res.json(records);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add medical record
router.post('/records', auth, checkRole(['patient']), upload.array('attachments', 5), async (req, res) => {
  try {
    const { type, title, date, doctor, description } = req.body;
    
    const attachments = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) || [];

    const record = new MedicalRecord({
      patient: req.user.userId,
      type,
      title,
      date,
      doctor,
      description,
      attachments
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    console.error('Add record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete medical record
router.delete('/records/:id', auth, checkRole(['patient']), async (req, res) => {
  try {
    const record = await MedicalRecord.findOneAndDelete({
      _id: req.params.id,
      patient: req.user.userId
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get analytics data
router.get('/analytics', auth, checkRole(['patient']), async (req, res) => {
  try {
    const [appointments, records] = await Promise.all([
      Appointment.find({ patient: req.user.userId }),
      MedicalRecord.find({ patient: req.user.userId })
    ]);

    const analytics = {
      appointments: {
        total: appointments.length,
        upcoming: appointments.filter(apt => new Date(apt.date) > new Date()).length,
        completed: appointments.filter(apt => apt.status === 'completed').length
      },
      records: {
        total: records.length,
        byType: records.reduce((acc, record) => {
          acc[record.type] = (acc[record.type] || 0) + 1;
          return acc;
        }, {})
      },
      // Add more analytics as needed
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/password', auth, checkRole(['patient']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification settings
router.put('/notifications', auth, checkRole(['patient']), async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { user: req.user.userId },
      { notificationSettings: req.body },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient.notificationSettings);
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Add these endpoints to your existing patients.js routes

// Get patient metrics
router.get('/metrics', auth, checkRole(['patient']), async (req, res) => {
  try {
    // Simulate fetching health metrics
    const metrics = [
      {
        date: new Date(),
        heartRate: 75,
        bloodPressure: {
          systolic: 120,
          diastolic: 80
        },
        weight: 70,
        steps: 8000
      }
    ];
    
    res.json(metrics);
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment statistics
router.get('/appointments/stats', auth, checkRole(['patient']), async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.userId });
    
    const stats = {
      total: appointments.length,
      upcoming: appointments.filter(apt => new Date(apt.date) > new Date()).length,
      completed: appointments.filter(apt => apt.status === 'completed').length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;