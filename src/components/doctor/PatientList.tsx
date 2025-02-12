import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  lastVisit?: string;
  upcomingAppointment?: {
    date: string;
    time: string;
  };
}

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/patients');
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'upcoming') return matchesSearch && patient.upcomingAppointment;
    if (selectedFilter === 'recent') {
      const lastVisit = new Date(patient.lastVisit || '');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return matchesSearch && lastVisit > thirtyDaysAgo;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Patients</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Patients</option>
            <option value="upcoming">Upcoming Appointments</option>
            <option value="recent">Recent Visits</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{patient.name}</h3>
                  <p className="text-sm text-slate-600">{patient.email}</p>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Phone:</span> {patient.phone}
                    </div>
                    <div>
                      <span className="font-medium">Gender:</span> {patient.gender}
                    </div>
                    <div>
                      <span className="font-medium">Blood Group:</span> {patient.bloodGroup}
                    </div>
                    <div>
                      <span className="font-medium">Age:</span>{' '}
                      {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/doctor/records/${patient._id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                    title="View Medical Records"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                  <Link
                    to={`/doctor/messages?patient=${patient._id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                    title="Send Message"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              {patient.upcomingAppointment && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-700">
                    <span className="font-medium">Upcoming Appointment:</span>{' '}
                    {new Date(patient.upcomingAppointment.date).toLocaleDateString()}{' '}
                    at {patient.upcomingAppointment.time}
                  </p>
                </div>
              )}

              {patient.lastVisit && (
                <p className="mt-2 text-sm text-slate-500">
                  Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-slate-500">No patients found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientList;