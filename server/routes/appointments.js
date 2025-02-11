import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// Get appointments for authenticated user (patient or doctor)
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'patient' 
      ? { patient: req.user.userId }
      : { doctor: req.user.userId };
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name')
      .populate('doctor', 'name specialization')
      .sort({ date: 1 });
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new appointment
router.post('/', auth, checkRole(['patient']), async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, symptoms } = req.body;

    // Check if doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      'timeSlot.startTime': timeSlot.startTime,
      'timeSlot.endTime': timeSlot.endTime,
      status: 'scheduled'
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot not available' });
    }

    const appointment = new Appointment({
      patient: req.user.userId,
      doctor: doctorId,
      date,
      timeSlot,
      type,
      symptoms
    });

    await appointment.save();

    // Send email notifications
    await sendEmail(doctor.email, 'New Appointment', `
      You have a new appointment scheduled for ${date} at ${timeSlot.startTime}.
      Patient: ${req.user.name}
      Type: ${type}
    `);

    await sendEmail(req.user.email, 'Appointment Confirmation', `
      Your appointment has been scheduled for ${date} at ${timeSlot.startTime}.
      Doctor: ${doctor.name}
      Type: ${type}
    `);

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add prescription to appointment
router.put('/:id/prescription', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const { medications, instructions } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.prescription = { medications, instructions };
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;