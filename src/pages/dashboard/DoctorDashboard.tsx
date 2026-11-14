import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, Calendar, FileText, BarChart as ChartBar, MessageSquare, Settings, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PatientList from '../../components/doctor/PatientList';
import AppointmentManager from '../../components/appointments/AppointmentManager';
import MedicalRecordsViewer from '../../components/doctor/MedicalRecordsViewer';
import DoctorOverview from '../../components/doctor/DoctorOverview';
import MessagingSystem from '../../components/Chat/MessagingSystem';
import ProfileSection from '../../components/profile/ProfileSection';
import SettingsPage from '../../components/settings/SettingsPage';

const DoctorDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getDoctorDisplayName = (name?: string) => {
    if (!name) return 'Doctor';
    const trimmed = name.trim();
    return trimmed.startsWith('Dr') ? trimmed : `Dr. ${trimmed}`;
  };

  const navigation = [
    { name: 'Overview', path: 'overview', icon: LayoutDashboard },
    { name: 'Patients', path: 'patients', icon: Users },
    { name: 'Appointments', path: 'appointments', icon: Calendar },
    { name: 'Medical Records', path: 'records', icon: FileText },
    { name: 'Messages', path: 'messages', icon: MessageSquare },
    { name: 'Profile', path: 'profile', icon: User },
    { name: 'Settings', path: 'settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg fixed h-screen z-10">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Doctor Portal</h2>
            <p className="text-sm text-slate-600 mt-1 truncate">
              Welcome, {getDoctorDisplayName(user?.name)}
            </p>
          </div>
          <nav className="mt-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = (item.path === 'overview' && (location.pathname.endsWith('/doctor') || location.pathname.endsWith('/doctor/dashboard') || location.pathname.endsWith('/doctor/overview'))) || location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path === 'overview' ? '' : item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-teal-700 bg-teal-50 border-r-4 border-teal-600'
                      : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 p-6 sm:p-8 min-h-screen">
          <Routes>
            <Route path="/" element={<DoctorOverview />} />
            <Route path="dashboard" element={<DoctorOverview />} />
            <Route path="overview" element={<DoctorOverview />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="appointments" element={<AppointmentManager />} />
            <Route path="records" element={<MedicalRecordsViewer />} />
            <Route path="messages" element={<MessagingSystem />} />
            <Route path="profile" element={<ProfileSection />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<DoctorOverview />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;