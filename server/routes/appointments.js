import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Appointment, Doctor, User } from '../models/index.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// Get available time slots for a doctor
router.get('/doctors/:doctorId/slots', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.doctorId);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleLowerCase();
    
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

// Create new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, symptoms } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if slot is available
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

    // Create appointment
    const appointment = new Appointment({
      patient: req.user.userId,
      doctor: doctorId,
      date,
      timeSlot,
      type,
      symptoms,
      status: 'scheduled'
    });

    await appointment.save();

    // Get doctor and patient details for email
    const doctorUser = await User.findById(doctor.user);
    const patientUser = await User.findById(req.user.userId);

    // Send email to doctor
    await sendEmail(
      doctorUser.email,
      'New Appointment Scheduled',
      `
        You have a new appointment scheduled:
        
        Date: ${new Date(date).toLocaleDateString()}
        Time: ${timeSlot.startTime} - ${timeSlot.endTime}
        Patient: ${patientUser.name}
        Type: ${type}
        
        Please log in to your dashboard to view more details.
      `
    );

    // Send email to patient
    await sendEmail(
      patientUser.email,
      'Appointment Confirmation',
      `
        Your appointment has been scheduled:
        
        Doctor: Dr. ${doctor.name}
        Date: ${new Date(date).toLocaleDateString()}
        Time: ${timeSlot.startTime} - ${timeSlot.endTime}
        Type: ${type}
        
        Please arrive 10 minutes before your appointment time.
        If you need to cancel or reschedule, please do so at least 24 hours in advance.
      `
    );

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'patient'
      ? { patient: req.user.userId }
      : { doctor: req.user.userId };

    const appointments = await Appointment.find(query)
      .populate('patient', 'name')
      .populate('doctor', 'name specialization')
      .sort({ date: 1, 'timeSlot.startTime': 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'user name')
      .populate('patient', 'user name');

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

    // Send email notifications
    const doctorUser = await User.findById(appointment.doctor.user);
    const patientUser = await User.findById(appointment.patient.user);

    const statusMessage = status === 'completed' ? 'completed' : 
                         status === 'cancelled' ? 'cancelled' : 
                         'updated';

    await sendEmail(
      doctorUser.email,
      `Appointment ${statusMessage}`,
      `
        The appointment with ${patientUser.name} on ${new Date(appointment.date).toLocaleDateString()} 
        at ${appointment.timeSlot.startTime} has been ${statusMessage}.
      `
    );

    await sendEmail(
      patientUser.email,
      `Appointment ${statusMessage}`,
      `
        Your appointment with Dr. ${appointment.doctor.name} on ${new Date(appointment.date).toLocaleDateString()} 
        at ${appointment.timeSlot.startTime} has been ${statusMessage}.
      `
    );

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;