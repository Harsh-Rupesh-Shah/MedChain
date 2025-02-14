import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Appointment, Doctor, User, Patient } from '../models/index.js';
import { sendAppointmentEmail } from '../utils/email.js';

const router = express.Router();

// Get available time slots for a doctor
// Get available time slots for a doctor
router.get('/doctors/:doctorId/slots', auth, async (req, res) => {
  try {
    const { date } = req.query;
    
    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: req.params.doctorId });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'monday' }).toLowerCase();
    
    // Get doctor's availability for that day
    const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);
    
    if (!dayAvailability) {
      return res.json({ slots: [] });
    }

    // Get existing appointments for that date
    const existingAppointments = await Appointment.find({
      doctor: doctor._id,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      },
      status: 'scheduled'
    });

    // Filter out booked slots
    const availableSlots = dayAvailability.slots.filter(slot => 
      !existingAppointments.some(apt => 
        apt.timeSlot.startTime === slot.startTime &&
        apt.timeSlot.endTime === slot.endTime
      )
    );

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, patientId, date, timeSlot, type, notes } = req.body;

    // Get the doctor by user ID
    const doctor = await Doctor.findOne({ user: doctorId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctor._id,
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
      patient: patient._id,
      doctor: doctor._id,
      date,
      timeSlot,
      type,
      notes,
      status: 'scheduled'
    });

    // Send email notifications
    const doctorUser = await User.findById(doctorId);
    const patientUser = await User.findById(patient.user);

    if (doctorUser && patientUser) {
      const appointmentDetails = {
        doctorName: doctor.name,
        patientName: patient.name,
        date,
        timeSlot,
        type
      };

      // Send emails and get meet link if it's a video call
      const meetLink = await sendAppointmentEmail(
        doctorUser.email,
        'New Appointment Scheduled',
        appointmentDetails
      );

      if (type === 'video' && meetLink) {
        appointment.meetLink = meetLink;
      }

      await sendAppointmentEmail(
        patientUser.email,
        'Appointment Confirmation',
        appointmentDetails
      );
    }

    await appointment.save();

    // Populate the response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name')
      .populate('doctor', 'name specialization');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get appointments for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.userId });
      query = { patient: patient._id };
    } else {
      const doctor = await Doctor.findOne({ user: req.user.userId });
      query = { doctor: doctor._id };
    }

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

export default router;