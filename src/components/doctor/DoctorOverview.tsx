import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, FileText, Video, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, MessageSquare, Activity, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  type: string;
  status: string;
  symptoms?: string[];
  notes?: string;
  meetLink?: string;
}

interface Patient {
  _id: string;
  name: string;
  email?: string;
  bloodGroup?: string;
  gender?: string;
}

const DoctorOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      const [aptsRes, patientsRes, statsRes] = await Promise.all([
        api.get('/appointments').catch(() => ({ data: [] })),
        api.get('/doctors/patients').catch(() => ({ data: [] })),
        api.get('/appointments/stats').catch(() => ({ data: { total: 0, upcoming: 0, completed: 0 } }))
      ]);

      if (Array.isArray(aptsRes.data)) {
        setAppointments(aptsRes.data);
      }
      if (Array.isArray(patientsRes.data)) {
        setPatients(patientsRes.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (e) {
      console.error('Error loading doctor overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getDoctorDisplayName = (name?: string) => {
    if (!name) return 'Doctor';
    const trimmed = name.trim();
    return trimmed.startsWith('Dr') ? trimmed : `Dr. ${trimmed}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => {
    const aptDate = a.date ? a.date.split('T')[0] : '';
    return aptDate === todayStr && a.status !== 'cancelled';
  });

  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled')
    .slice(0, 5);

  const handleStatusChange = async (aptId: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${aptId}/status`, { status: newStatus });
      toast.success(`Appointment marked as ${newStatus}`);
      loadDoctorData();
    } catch (err) {
      toast.error('Failed to update appointment status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Clinical Card */}
      <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <ShieldCheck className="h-3 w-3" /> Verified Clinician
              </span>
              <span className="text-xs text-slate-300">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {getDoctorDisplayName(user?.name)}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              MedChain Clinical Portal &bull; You have <span className="font-semibold text-teal-300">{todayAppointments.length} patient consultation{todayAppointments.length === 1 ? '' : 's'}</span> scheduled for today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4" /> Manage Schedule
            </button>
            <button
              onClick={() => navigate('/doctor/messages')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors border border-white/20 inline-flex items-center gap-1.5"
            >
              <MessageSquare className="h-4 w-4" /> Messages
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row (4 Columns across full width) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Today's Consultations</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{todayAppointments.length}</h3>
            <p className="text-[11px] text-teal-600 mt-0.5 font-medium">Scheduled for today</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Patients</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{patients.length}</h3>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-medium">Registered roster</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Consultations</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total || appointments.length}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">{stats.completed} completed</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Upcoming Visits</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.upcoming || upcomingAppointments.length}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Confirmed slots</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's / Upcoming Consultations (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Upcoming Consultations & Telehealth</h2>
                <p className="text-xs text-slate-500">Patient visits requiring attendance or video consultation</p>
              </div>
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="text-xs font-medium text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
              >
                View all ({appointments.length}) <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-700">No scheduled consultations right now</p>
                  <p className="text-xs text-slate-400">New appointments booked by patients will appear here automatically.</p>
                </div>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div key={apt._id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{apt.patient?.name || 'Patient'}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          apt.type === 'video' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {apt.type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(apt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}
                        </span>
                      </div>
                      {apt.symptoms && apt.symptoms.length > 0 && (
                        <p className="text-xs text-slate-600 pt-1">
                          <span className="font-medium text-slate-700">Chief Complaint:</span> {Array.isArray(apt.symptoms) ? apt.symptoms.join(', ') : apt.symptoms}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {apt.type === 'video' && (
                        <a
                          href={apt.meetLink || 'https://meet.google.com/new'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          title="Open Google Meet consultation room"
                        >
                          <Video className="h-3.5 w-3.5" /> Start Meet
                        </a>
                      )}
                      <button
                        onClick={() => handleStatusChange(apt._id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Patients Roster & Quick Actions (1 Col wide) */}
        <div className="space-y-6">
          {/* Patient Roster Quick List */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent Patients</h2>
              <button
                onClick={() => navigate('/doctor/patients')}
                className="text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                View all ({patients.length})
              </button>
            </div>

            <div className="space-y-3">
              {patients.slice(0, 5).map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => navigate('/doctor/records')}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                      {patient.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">{patient.name}</h4>
                      <p className="text-[11px] text-slate-400">{patient.bloodGroup ? `Blood: ${patient.bloodGroup}` : 'Patient'}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              ))}
              {patients.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No patients assigned yet.</p>
              )}
            </div>
          </div>

          {/* Clinical Shortcuts Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Clinical Shortcuts</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate('/doctor/records')}
                className="p-3 text-left rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 space-y-1"
              >
                <FileText className="h-4 w-4 text-teal-600" />
                <p className="text-xs font-semibold text-slate-800">Medical Vault</p>
                <p className="text-[10px] text-slate-400">Review lab records</p>
              </button>
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="p-3 text-left rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 space-y-1"
              >
                <Calendar className="h-4 w-4 text-indigo-600" />
                <p className="text-xs font-semibold text-slate-800">Appointments</p>
                <p className="text-[10px] text-slate-400">Slots & booking</p>
              </button>
              <button
                onClick={() => navigate('/doctor/messages')}
                className="p-3 text-left rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 space-y-1"
              >
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-slate-800">Messaging</p>
                <p className="text-[10px] text-slate-400">Chat with patients</p>
              </button>
              <button
                onClick={() => navigate('/doctor/patients')}
                className="p-3 text-left rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 space-y-1"
              >
                <Users className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-semibold text-slate-800">Patient Roster</p>
                <p className="text-[10px] text-slate-400">History & triage</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;

