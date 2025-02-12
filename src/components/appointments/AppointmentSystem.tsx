import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, AlertCircle, Calendar as CalendarIcon, X, Plus } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: 'in-person' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled' | 'waiting';
  notes?: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  availability: {
    day: string;
    slots: {
      startTime: string;
      endTime: string;
      isBooked: boolean;
    }[];
  }[];
}

const AppointmentSystem = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: {
      startTime: '',
      endTime: ''
    },
    type: 'in-person' as 'in-person' | 'video',
    notes: ''
  });

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data);
    } catch (error) {
      toast.error('Failed to load doctors');
    }
  };

  const handleSchedule = async () => {
    try {
      if (!newAppointment.doctorId || !newAppointment.timeSlot.startTime) {
        toast.error('Please select a doctor and time slot');
        return;
      }

      setLoading(true);
      await api.post('/appointments', newAppointment);
      toast.success('Appointment scheduled successfully');
      setShowSchedule(false);
      loadAppointments();
      setNewAppointment({
        doctorId: '',
        date: new Date().toISOString().split('T')[0],
        timeSlot: {
          startTime: '',
          endTime: ''
        },
        type: 'in-person',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: 'cancelled' });
      toast.success('Appointment cancelled successfully');
      loadAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const getAvailableSlots = () => {
    if (!selectedDoctor || !newAppointment.date) return [];
    
    const doctor = doctors.find(d => d._id === newAppointment.doctorId);
    if (!doctor) return [];

    const dayOfWeek = new Date(newAppointment.date)
      .toLocaleDateString('en-US', { weekday: 'monday' })
      .toLowerCase();
      
    const availability = doctor.availability.find(a => a.day === dayOfWeek);
    return availability?.slots.filter(slot => !slot.isBooked) || [];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <button 
          className="btn-primary flex items-center"
          onClick={() => setShowSchedule(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Schedule New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Appointments List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Upcoming Appointments</h3>
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className={`border rounded-lg p-4 ${
                  apt.status === 'cancelled' ? 'bg-red-50' :
                  apt.status === 'completed' ? 'bg-green-50' :
                  apt.status === 'waiting' ? 'bg-yellow-50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{apt.type === 'video' ? 'Video Call' : 'In-Person'}</h4>
                    <p className="text-sm text-slate-600">with Dr. {apt.doctorName}</p>
                    <p className="text-sm text-slate-600">{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {apt.type === 'video' && apt.status === 'scheduled' && (
                      <button className="btn-primary text-sm">
                        <Video className="h-4 w-4 mr-1 inline" />
                        Join Call
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="text-red-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {apt.notes && (
                  <p className="mt-2 text-sm text-slate-600">{apt.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* Calendar View */}
          <div>
            <div className="bg-slate-50 rounded-lg p-4">
              <Calendar
                value={selectedDate}
                onChange={setSelectedDate}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Schedule Appointment</h3>
              <button onClick={() => setShowSchedule(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Doctor
                </label>
                <select
                  value={newAppointment.doctorId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {getAvailableSlots().map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setNewAppointment({
                        ...newAppointment,
                        timeSlot: {
                          startTime: slot.startTime,
                          endTime: slot.endTime
                        }
                      })}
                      className={`p-2 rounded-lg border text-sm ${
                        newAppointment.timeSlot.startTime === slot.startTime
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-500'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Appointment Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setNewAppointment({ ...newAppointment, type: 'in-person' })}
                    className={`flex-1 p-3 rounded-lg border ${
                      newAppointment.type === 'in-person'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-indigo-500'
                    }`}
                  >
                    In-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAppointment({ ...newAppointment, type: 'video' })}
                    className={`flex-1 p-3 rounded-lg border ${
                      newAppointment.type === 'video'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-indigo-500'
                    }`}
                  >
                    Video Call
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="Add any notes or symptoms..."
                />
              </div>

              <button
                onClick={handleSchedule}
                disabled={loading || !newAppointment.doctorId || !newAppointment.timeSlot.startTime}
                className="btn-primary w-full"
              >
                {loading ? 'Scheduling...' : 'Schedule Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentSystem;