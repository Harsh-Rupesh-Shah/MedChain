import React, { useState } from 'react';
import { Calendar, Clock, Video, MapPin, AlertCircle } from 'lucide-react';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: 'in-person' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

const AppointmentManager = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status } : apt
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <button className="btn-primary">Schedule New</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Upcoming Appointments</h3>
          {appointments.map((apt) => (
            <div 
              key={apt.id} 
              className={`border rounded-lg p-4 ${
                apt.status === 'cancelled' ? 'bg-red-50' : 
                apt.status === 'completed' ? 'bg-green-50' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{apt.type === 'video' ? 'Video Call' : 'In-Person'}</h4>
                  <p className="text-sm text-slate-600">
                    with Dr. {apt.doctorName}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {apt.type === 'video' ? (
                    <Video className="h-5 w-5 text-indigo-500" />
                  ) : (
                    <MapPin className="h-5 w-5 text-indigo-500" />
                  )}
                  <span className="text-sm font-medium">
                    {apt.time}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-4">
                <button className="btn-secondary text-sm">
                  {apt.type === 'video' ? 'Join Call' : 'Get Directions'}
                </button>
                <button 
                  className="text-red-500 text-sm"
                  onClick={() => handleStatusChange(apt.id, 'cancelled')}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-slate-50 rounded-lg p-4">
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManager;