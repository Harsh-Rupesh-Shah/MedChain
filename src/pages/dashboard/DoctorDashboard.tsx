import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, Calendar, FileText, BarChart as ChartBar, MessageSquare, Settings, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PatientList from '../../components/doctor/PatientList';
import AppointmentManager from '../../components/appointments/AppointmentManager';
import MedicalRecordsViewer from '../../components/doctor/MedicalRecordsViewer';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import MessagingSystem from '../../components/Chat/MessagingSystem';
import ProfileSection from '../../components/profile/ProfileSection';
import SettingsPage from '../../components/settings/SettingsPage';

const DoctorDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Patients', path: 'patients', icon: Users },
    { name: 'Appointments', path: 'appointments', icon: Calendar },
    { name: 'Medical Records', path: 'records', icon: FileText },
    { name: 'Analytics', path: 'analytics', icon: ChartBar },
    { name: 'Messages', path: 'messages', icon: MessageSquare },
    { name: 'Profile', path: 'profile', icon: User },
    { name: 'Settings', path: 'settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg fixed h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold">Doctor Dashboard</h2>
            <p className="text-sm text-slate-600 mt-1">Welcome, Dr. {user?.name}</p>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
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
        <div className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<AnalyticsDashboard />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="appointments" element={<AppointmentManager />} />
            <Route path="records" element={<MedicalRecordsViewer />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="messages" element={<MessagingSystem />} />
            <Route path="profile" element={<ProfileSection />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;