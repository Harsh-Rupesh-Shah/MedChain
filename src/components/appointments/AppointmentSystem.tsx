import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, AlertCircle, Calendar as CalendarIcon, X } from 'lucide-react';
import { appointments } from '../../services/api';
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

const AppointmentSystem = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [waitingList, setWaitingList] = useState<Appointment[]>([]);
  const [showVideoCall, setShowVideoCall] = useState(false);

  useEffect(() => {
    loadAppointments();
    // Set up calendar sync
    const googleCalendarSync = async () => {
      // Implement Google Calendar API integration
      console.log('Syncing with Google Calendar...');
    };
    googleCalendarSync();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      const response = await appointments.getAll();
      setAppointments(response.data);
    } catch (error) {
      toast.error('Failed to load appointments');
    }
  };

  const handleReschedule = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      await appointments.updateStatus(appointmentId, 'scheduled');
      toast.success('Appointment rescheduled successfully');
      loadAppointments();
      setShowReschedule(false);
    } catch (error) {
      toast.error('Failed to reschedule appointment');
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await appointments.updateStatus(appointmentId, 'cancelled');
      // Check waiting list and notify next patient
      if (waitingList.length > 0) {
        const nextPatient = waitingList[0];
        // Send notification
        toast.success(`Notifying ${nextPatient.patientName} about available slot`);
        setWaitingList(prev => prev.slice(1));
      }
      loadAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const addToWaitingList = async (appointment: Appointment) => {
    setWaitingList(prev => [...prev, { ...appointment, status: 'waiting' }]);
    toast.success('Added to waiting list');
  };

  const startVideoCall = (appointmentId: string) => {
    setShowVideoCall(true);
    setSelectedAppointment(appointments.find(apt => apt.id === appointmentId) || null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <div className="flex space-x-4">
          <button className="btn-secondary" onClick={() => setShowReschedule(true)}>
            Schedule New
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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

        {/* Appointments List */}
        <div className="space-y-4">
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
                  <p className="text-sm text-slate-600">{apt.date} at {apt.time}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {apt.type === 'video' && apt.status === 'scheduled' && (
                    <button
                      onClick={() => startVideoCall(apt.id)}
                      className="btn-primary text-sm"
                    >
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
            </div>
          ))}
        </div>
      </div>

      {/* Waiting List */}
      {waitingList.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Waiting List</h3>
          <div className="space-y-2">
            {waitingList.map((patient, index) => (
              <div key={index} className="bg-yellow-50 p-3 rounded-lg flex justify-between items-center">
                <span>{patient.patientName}</span>
                <span className="text-sm text-slate-600">Position: {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Video Call with {selectedAppointment.doctorName}
              </h3>
              <button onClick={() => setShowVideoCall(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="aspect-video bg-slate-900 rounded-lg mb-4">
              {/* Video call implementation */}
              <div className="flex items-center justify-center h-full text-white">
                Video call interface would be integrated here
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button className="btn-secondary" onClick={() => setShowVideoCall(false)}>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentSystem;