import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, FileText } from 'lucide-react';
import { doctors } from '../services/api';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  availability: {
    day: string;
    slots: TimeSlot[];
  }[];
}

interface AppointmentSchedulerProps {
  onSchedule: (appointment: any) => Promise<void>;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ onSchedule }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'video'>('in-person');
  const [symptoms, setSymptoms] = useState<string>('');
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctors.getAll();
      setAvailableDoctors(response.data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
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
    
    return availability?.slots.filter(slot => !slot.isBooked) || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedTimeSlot) return;

    try {
      await onSchedule({
        doctorId: selectedDoctor,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        type: appointmentType,
        symptoms: symptoms.split('\n')
      });
    } catch (err) {
      console.error('Failed to schedule appointment:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Schedule Appointment</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
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

        {/* Date Selection */}
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

        {/* Time Slot Selection */}
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
                <Clock className="h-4 w-4 inline-block mr-1" />
                {slot.startTime} - {slot.endTime}
              </button>
            ))}
          </div>
        </div>

        {/* Appointment Type */}
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
              <User className="h-5 w-5 mx-auto mb-2" />
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
              <Video className="h-5 w-5 mx-auto mb-2" />
              Video Call
            </button>
          </div>
        </div>

        {/* Symptoms */}
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
            <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
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