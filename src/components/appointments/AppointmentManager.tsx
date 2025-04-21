import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, AlertCircle, Plus, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
  };
  doctor: {
    _id: string;
    name: string;
    specialization: string;
  };
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  type: 'in-person' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  meetLink?: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
}

const AppointmentManager = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string; }[]>([]);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
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
    loadPatients();
  }, []);

  useEffect(() => {
    if (user?._id && newAppointment.date) {
      loadAvailableSlots();
    }
  }, [newAppointment.date, user?._id]);

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

  const loadPatients = async () => {
    try {
      const response = await api.get('/doctors/patients');
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to load patients');
    }
  };

  // Update the loadAvailableSlots function
  const loadAvailableSlots = async () => {
    if (!user?._id || !newAppointment.date) return;
    
    try {
      console.log('Loading slots for doctor (user):', user._id, 'date:', newAppointment.date);
      const response = await api.get(`/appointments/doctors/${user._id}/slots`, {
        params: { 
          date: newAppointment.date,
          // Add cache busting if needed
          _: Date.now() 
        }
      });
      console.log('Received slots:', response.data.slots);
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
      toast.error('Failed to load available time slots');
      setAvailableSlots([]);
    }
  };
  
  const handleSchedule = async () => {
    if (!newAppointment.patientId || !newAppointment.timeSlot.startTime) {
      toast.error('Please select a patient and time slot');
      return;
    }

    try {
      setLoading(true);
      
      // Create appointment data
      const appointmentData = {
        doctorId: user?._id, // This is the doctor's user ID
        patientId: newAppointment.patientId,
        date: newAppointment.date,
        timeSlot: newAppointment.timeSlot,
        type: newAppointment.type,
        notes: newAppointment.notes
      };

      await api.post('/appointments', appointmentData);
      toast.success('Appointment scheduled successfully');
      setShowSchedule(false);
      loadAppointments();
      
      // Reset form
      setNewAppointment({
        patientId: '',
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

  const handleJoinMeeting = (meetLink: string) => {
    window.open(meetLink, '_blank');
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
                key={apt._id}
                className={`border rounded-lg p-4 ${
                  apt.status === 'cancelled' ? 'bg-red-50' :
                  apt.status === 'completed' ? 'bg-green-50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{apt.type === 'video' ? 'Video Call' : 'In-Person'}</h4>
                    <p className="text-sm text-slate-600">
                      {user?.role === 'doctor' 
                        ? `Patient: ${apt.patient.name}`
                        : `Dr. ${apt.doctor.name}`
                    }
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(apt.date).toLocaleDateString()} at {apt.timeSlot.startTime}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {apt.type === 'video' && apt.status === 'scheduled' && apt.meetLink && (
                      <button
                        onClick={() => handleJoinMeeting(apt.meetLink!)}
                        className="btn-primary text-sm"
                      >
                        <Video className="h-4 w-4 mr-1 inline" />
                        Join Call
                      </button>
                    )}
                    {apt.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="text-red-500 text-sm hover:text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {apt.notes && (
                  <p className="mt-2 text-sm text-slate-600">{apt.notes}</p>
                )}
              </div>
            ))}

            {appointments.length === 0 && (
              <p className="text-center text-slate-500 py-4">No appointments scheduled</p>
            )}
          </div>

          {/* Calendar View */}
          <div>
            <div className="bg-slate-50 rounded-lg p-4">
              <Calendar
                value={new Date()}
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
                  Select Patient
                </label>
                <select
                  value={newAppointment.patientId}
                  onChange={(e) => setNewAppointment({ 
                    ...newAppointment, 
                    patientId: e.target.value,
                    timeSlot: { startTime: '', endTime: '' }
                  })}
                  className="input-field"
                >
                  <option value="">Choose a patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name}
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
                  onChange={(e) => setNewAppointment({ 
                    ...newAppointment, 
                    date: e.target.value,
                    timeSlot: { startTime: '', endTime: '' }
                  })}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot, index) => (
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
                    ))
                  ) : (
                    <p className="col-span-3 text-center text-slate-500 py-2">
                      {newAppointment.date 
                        ? 'No available slots for selected date' 
                        : 'Select date to view available slots'}
                    </p>
                  )}
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
                  placeholder="Add any notes or instructions..."
                />
              </div>

              <button
                onClick={handleSchedule}
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

export default AppointmentManager;