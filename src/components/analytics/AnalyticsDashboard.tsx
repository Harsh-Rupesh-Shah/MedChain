import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Calendar, Activity, Heart, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface HealthMetric {
  date: string;
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  weight: number;
  steps: number;
}

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [appointments, setAppointments] = useState({
    total: 0,
    upcoming: 0,
    completed: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsResponse, appointmentsResponse] = await Promise.all([
        api.get('/patients/metrics'),
        api.get('/appointments/stats')
      ]);

      setMetrics(metricsResponse.data);
      setAppointments(appointmentsResponse.data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getLatestMetric = () => {
    return metrics[metrics.length - 1] || {
      heartRate: 0,
      bloodPressure: { systolic: 0, diastolic: 0 },
      weight: 0,
      steps: 0
    };
  };

  const latestMetric = getLatestMetric();

  const stats = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "Heart Rate",
      value: `${latestMetric.heartRate} BPM`,
      trend: "+2%",
      color: "text-red-500"
    },
    {
      icon: <Activity className="h-8 w-8 text-indigo-500" />,
      title: "Blood Pressure",
      value: `${latestMetric.bloodPressure.systolic}/${latestMetric.bloodPressure.diastolic}`,
      trend: "Normal",
      color: "text-indigo-500"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-emerald-500" />,
      title: "Weight",
      value: `${latestMetric.weight} kg`,
      trend: "-0.5kg",
      color: "text-emerald-500"
    },
    {
      icon: <Clock className="h-8 w-8 text-amber-500" />,
      title: "Daily Steps",
      value: latestMetric.steps.toLocaleString(),
      trend: "+12%",
      color: "text-amber-500"
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full bg-opacity-10 ${stat.color.replace('text', 'bg')}`}>
                {stat.icon}
              </div>
              <span className={`text-sm font-medium ${
                stat.trend.includes('+') ? 'text-emerald-500' : 
                stat.trend.includes('-') ? 'text-red-500' : 
                'text-indigo-500'
              }`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{stat.title}</h3>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Appointments Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Appointments Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Total Appointments</p>
                <h3 className="text-2xl font-bold text-indigo-900">{appointments.total}</h3>
              </div>
              <Calendar className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Upcoming</p>
                <h3 className="text-2xl font-bold text-emerald-900">{appointments.upcoming}</h3>
              </div>
              <Calendar className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Completed</p>
                <h3 className="text-2xl font-bold text-amber-900">{appointments.completed}</h3>
              </div>
              <Calendar className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Health Trends */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Health Trends</h2>
        <div className="h-64 bg-slate-50 rounded-lg p-4">
          {/* Add chart component here */}
          <div className="flex items-center justify-center h-full text-slate-400">
            Health metrics visualization will be displayed here
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center p-3 bg-slate-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-medium">Health Check Completed</p>
                <p className="text-sm text-slate-500">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;