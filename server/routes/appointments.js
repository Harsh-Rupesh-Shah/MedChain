import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Appointment, Doctor, User, Patient } from '../models/index.js';
import { sendAppointmentEmail } from '../utils/email.js';

const router = express.Router();

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
    const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Get doctor's availability for that day
    const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);
    
    if (!dayAvailability) {
      return res.json({ slots: [] });
    }

    // Get current time
    const now = new Date();
    const selectedDate = new Date(date);
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Get existing appointments for that date
    const existingAppointments = await Appointment.find({
      doctor: doctor._id,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      },
      status: { $ne: 'cancelled' }
    });

    // Filter out booked slots and past time slots
    const availableSlots = dayAvailability.slots.filter(slot => {
      // Check if slot is not booked
      const isBooked = existingAppointments.some(apt => 
        apt.timeSlot.startTime === slot.startTime &&
        apt.timeSlot.endTime === slot.endTime
      );

      // If it's today, check if the slot time hasn't passed
      if (isToday) {
        const [hours, minutes] = slot.startTime.split(':');
        const slotTime = new Date(selectedDate);
        slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return !isBooked && slotTime > now;
      }

      return !isBooked;
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
    const { doctorId, date, timeSlot, type, notes } = req.body;

    // Get the doctor by user ID
    const doctor = await Doctor.findOne({ user: doctorId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get the patient from the authenticated user
    const patient = await Patient.findOne({ user: req.user.userId });
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

    // Check if slot time hasn't passed
    const [hours, minutes] = timeSlot.startTime.split(':');
    const slotTime = new Date(date);
    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (slotTime < new Date()) {
      return res.status(400).json({ message: 'Cannot book past time slots' });
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
    const patientUser = await User.findById(req.user.userId);

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

// Get appointments (with automatic cleanup of past appointments)
router.get('/', auth, async (req, res) => {
  try {
    // Clean up past appointments
    const now = new Date();
    await Appointment.deleteMany({
      $or: [
        {
          date: { $lt: now },
          status: 'scheduled'
        },
        {
          date: now.toDateString(),
          'timeSlot.startTime': { 
            $lt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          },
          status: 'scheduled'
        }
      ]
    });

    // Get current appointments
    let query = {};
    
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.userId });
      if (doctor) {
        query.doctor = doctor._id;
      }
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.userId });
      if (patient) {
        query.patient = patient._id;
      }
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

// Cancel appointment
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment time has passed
    const [hours, minutes] = appointment.timeSlot.startTime.split(':');
    const appointmentTime = new Date(appointment.date);
    appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (appointmentTime < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past appointments' });
    }

    // Check if user has permission to cancel
    const isDoctor = await Doctor.findOne({ user: req.user.userId });
    const isPatient = await Patient.findOne({ user: req.user.userId });

    if (
      (!isDoctor || isDoctor._id.toString() !== appointment.doctor.toString()) &&
      (!isPatient || isPatient._id.toString() !== appointment.patient.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;