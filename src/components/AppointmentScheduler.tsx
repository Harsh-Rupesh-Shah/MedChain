import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, FileText } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const AppointmentScheduler = ({ onSchedule }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [symptoms, setSymptoms] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors');
      setAvailableDoctors(response.data);
    } catch (error) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDoctor) return [];

    const doctor = availableDoctors.find(d => d._id === selectedDoctor);
    if (!doctor) return [];

    const dayOfWeek = selectedDate.toLocaleLowerCase();
    const availability = doctor.availability.find(a => a.day === dayOfWeek);

    if (!availability) return [];

    const existingAppointments = appointments.filter(apt =>
      apt.doctor._id === selectedDoctor &&
      new Date(apt.date).toDateString() === selectedDate.toDateString()
    );

    return availability.slots.filter(slot => {
      const isBooked = existingAppointments.some(apt =>
        apt.timeSlot.startTime === slot.startTime &&
        apt.timeSlot.endTime === slot.endTime
      );

      const isPastTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`) < new Date();

      return !isBooked && !isPastTime;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedTimeSlot) return;

    try {
      const appointmentData = {
        doctorId: selectedDoctor,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        type: appointmentType,
        symptoms: symptoms.split('\n')
      };

      console.log('Scheduling appointment with data:', appointmentData);

      await onSchedule(appointmentData);
      toast.success('Appointment scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule appointment');
      console.error('Error scheduling appointment:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Schedule Appointment</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Doctor
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Choose a doctor</option>
            {availableDoctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                Dr. {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="input-field pl-10"
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Time Slot
          </label>
          <div className="grid grid-cols-3 gap-2">
            {getAvailableTimeSlots().map((slot, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedTimeSlot(slot)}
                className={`p-2 rounded-lg border text-sm ${
                  selectedTimeSlot === slot
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-indigo-500'
                }`}
              >
                <Clock className="h-4 w-4 mr-1 inline" />
                {slot.startTime} - {slot.endTime}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Appointment Type
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setAppointmentType('in-person')}
              className={`flex-1 p-3 rounded-lg border ${
                appointmentType === 'in-person'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-500'
              }`}
            >
              In-Person
            </button>
            <button
              type="button"
              onClick={() => setAppointmentType('video')}
              className={`flex-1 p-3 rounded-lg border ${
                appointmentType === 'video'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-500'
              }`}
            >
              Video Call
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Symptoms & Notes
          </label>
          <div className="relative">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="input-field min-h-[100px] pl-10"
              placeholder="Describe your symptoms..."
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={!selectedDoctor || !selectedTimeSlot}
        >
          Schedule Appointment
        </button>
      </form>
    </div>
  );
};

export default AppointmentScheduler;
