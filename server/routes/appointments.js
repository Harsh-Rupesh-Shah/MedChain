import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { Appointment, Doctor, User, Patient } from '../models/index.js';
import { sendAppointmentEmail } from '../utils/email.js';

const router = express.Router();

// Get available time slots for a doctor - Updated version
router.get('/doctors/:doctorId/slots', auth, async (req, res) => {
  try {
    const { date } = req.query;
    console.log('Fetching slots for:', { doctorId: req.params.doctorId, date });

    // Find doctor by either user ID or doctor _id
    let doctor = await Doctor.findOne({ user: req.params.doctorId })
      .populate('user', 'email name');
    
    if (!doctor) {
      doctor = await Doctor.findById(req.params.doctorId)
        .populate('user', 'email name');
    }

    if (!doctor) {
      console.log('Doctor not found with ID:', req.params.doctorId);
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Validate date
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const selectedDate = new Date(date);
    // Get day name in lowercase (e.g., "monday")
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'UTC' // Use UTC to avoid timezone issues
    }).toLowerCase();

    console.log('Selected date:', selectedDate, 'Day of week:', dayOfWeek);

    // Find availability for the day
    const dayAvailability = doctor.availability.find(a => 
      a.day.toLowerCase() === dayOfWeek
    );

    if (!dayAvailability) {
      console.log('No availability for day:', dayOfWeek);
      return res.json({ slots: [] });
    }

    console.log('Day availability:', dayAvailability);

    // Get current time in UTC
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Get existing appointments for that date (UTC day)
    const startOfDay = new Date(selectedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor: doctor._id,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $ne: 'cancelled' }
    });

    console.log('Existing appointments:', existingAppointments.length);

    // Filter available slots
    const availableSlots = dayAvailability.slots.filter(slot => {
      // Check if slot is booked
      const isBooked = existingAppointments.some(apt =>
        apt.timeSlot.startTime === slot.startTime &&
        apt.timeSlot.endTime === slot.endTime
      );

      // If today, check if slot time hasn't passed
      if (isToday) {
        const [hours, minutes] = slot.startTime.split(':').map(Number);
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hours, minutes, 0, 0);
        
        // Compare in UTC to avoid timezone issues
        const nowUTC = new Date();
        return !isBooked && slotTime > nowUTC;
      }

      return !isBooked;
    });

    console.log('Available slots:', availableSlots);
    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new appointment - Updated version
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, patientId, date, timeSlot, type, notes } = req.body;

    // Get the doctor (try both by user ID and doctor _id)
    let doctor = await Doctor.findOne({ user: doctorId });
    if (!doctor) {
      doctor = await Doctor.findById(doctorId);
    }
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get the patient (for doctor-side scheduling)
    let patient;
    if (patientId) {
      patient = await Patient.findOne({ user: patientId });
      if (!patient) {
        patient = await Patient.findById(patientId);
      }
    } else {
      // For patient-side scheduling
      patient = await Patient.findOne({ user: req.user.userId });
    }

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Rest of the appointment creation logic remains the same...
    // [Keep the existing code for slot checking and appointment creation]
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