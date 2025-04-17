import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Product, Patient, Doctor } from '../models/index.js';

const router = express.Router();

// Get all prescriptions for a doctor
router.get('/doctor/prescriptions', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const prescriptions = await Prescription.find({ doctor: doctor._id })
      .populate('patient', 'name')
      .sort({ date: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new prescription
router.post('/doctor/prescriptions', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const { patientId, medications } = req.body;

    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const prescription = new Prescription({
      doctor: doctor._id,
      patient: patientId,
      medications,
      status: 'active',
      date: new Date()
    });

    await prescription.save();
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient's prescriptions
router.get('/patient/prescriptions', auth, checkRole(['patient']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.userId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medication reminders
router.get('/patient/medication-reminders', auth, checkRole(['patient']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.userId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const activePrescriptions = await Prescription.find({
      patient: patient._id,
      status: 'active'
    });

    // Generate reminders based on medication schedules
    const reminders = [];
    const now = new Date();

    activePrescriptions.forEach(prescription => {
      prescription.medications.forEach(medication => {
        // Parse frequency to generate reminder times
        const times = parseFrequency(medication.frequency);
        times.forEach(time => {
          reminders.push({
            _id: `${prescription._id}-${medication.name}-${time}`,
            medicationName: medication.name,
            time,
            taken: false
          });
        });
      });
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to parse medication frequency
function parseFrequency(frequency) {
  // Simple parsing logic - expand this based on your needs
  switch (frequency.toLowerCase()) {
    case 'once daily':
      return ['09:00'];
    case 'twice daily':
      return ['09:00', '21:00'];
    case 'three times daily':
      return ['09:00', '15:00', '21:00'];
    default:
      return ['09:00'];
  }
}

export default router;