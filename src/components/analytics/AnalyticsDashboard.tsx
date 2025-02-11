import React from 'react';
import { BarChart2, TrendingUp, Users, Calendar } from 'lucide-react';

const AnalyticsDashboard = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Total Appointments</p>
              <h3 className="text-2xl font-bold text-indigo-900">248</h3>
            </div>
            <Calendar className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="mt-2 text-sm text-indigo-600">
            <TrendingUp className="h-4 w-4 inline mr-1" />
            +12% from last month
          </div>
        </div>

        {/* Add more stat cards */}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Charts and Graphs */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Appointment Trends</h3>
          {/* Add chart component */}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Patient Demographics</h3>
          {/* Add chart component */}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;