import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, Calendar, FileText, BarChart as ChartBar, MessageSquare, Settings, User } from 'lucide-react';

const DoctorDashboard = () => {
  const location = useLocation();

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
          </div>
          <nav className="mt-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    location.pathname.includes(item.path)
                      ? 'text-indigo-600 bg-indigo-50'
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
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;