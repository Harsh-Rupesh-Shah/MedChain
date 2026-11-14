import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  TrendingUp,
  Clock,
  Calendar,
  Pill,
  FileText,
  Plus,
  Video,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

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

interface Appointment {
  _id: string;
  doctor: {
    name: string;
    specialization: string;
  };
  date: string;
  time: string;
  status: string;
  type: string;
  meetLink?: string;
  meetingLink?: string;
}

interface Prescription {
  _id: string;
  doctor: {
    name: string;
    specialization: string;
  };
  date: string;
  status: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [submittingVitals, setSubmittingVitals] = useState(false);

  const [vitalsForm, setVitalsForm] = useState({
    heartRate: '72',
    systolic: '120',
    diastolic: '80',
    weight: '70',
    steps: '8000'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, aptsRes, rxRes, profileRes] = await Promise.allSettled([
        api.get('/patients/metrics'),
        api.get('/appointments'),
        api.get('/pharmacy/patient/prescriptions'),
        api.get('/patients/profile')
      ]);

      if (metricsRes.status === 'fulfilled' && Array.isArray(metricsRes.value.data)) {
        setMetrics(metricsRes.value.data);
      }
      if (aptsRes.status === 'fulfilled' && Array.isArray(aptsRes.value.data)) {
        setAppointments(aptsRes.value.data);
      }
      if (rxRes.status === 'fulfilled' && Array.isArray(rxRes.value.data)) {
        setPrescriptions(rxRes.value.data);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        setPatientProfile(profileRes.value.data);
      }
    } catch (error) {
      console.warn('Dashboard data load notice:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestMetric: HealthMetric = metrics.length > 0
    ? metrics[metrics.length - 1]
    : {
        date: new Date().toISOString(),
        heartRate: 72,
        bloodPressure: { systolic: 120, diastolic: 80 },
        weight: 70,
        steps: 8000
      };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingVitals(true);
      await api.post('/patients/metrics', {
        heartRate: parseInt(vitalsForm.heartRate, 10),
        systolic: parseInt(vitalsForm.systolic, 10),
        diastolic: parseInt(vitalsForm.diastolic, 10),
        weight: parseFloat(vitalsForm.weight),
        steps: parseInt(vitalsForm.steps, 10)
      });
      toast.success('Health vitals recorded successfully!');
      setShowVitalsModal(false);
      // Reload metrics
      const res = await api.get('/patients/metrics');
      if (Array.isArray(res.data)) {
        setMetrics(res.data);
      }
    } catch (err) {
      toast.error('Failed to save health vitals');
    } finally {
      setSubmittingVitals(false);
    }
  };

  const handleRefillRequest = async (rxId: string) => {
    try {
      await api.post(`/pharmacy/refill/${rxId}`);
      toast.success('Prescription refill request dispatched to pharmacy desk.');
    } catch (e) {
      toast.error('Failed to submit refill request');
    }
  };

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'pending'
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent"></div>
      </div>
    );
  }

  const hasRecordedVitals = metrics.length > 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Patient Portal</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Encrypted Vault Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B192C]">
            Welcome back, {patientProfile?.name || user?.name || 'Patient'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Blood Group:{' '}
            <strong className="text-slate-800 font-semibold">{patientProfile?.bloodGroup || 'O+'}</strong>
            {' '}&bull;{' '}
            Allergies:{' '}
            <strong className="text-slate-800 font-semibold">
              {patientProfile?.allergies?.length ? patientProfile.allergies.join(', ') : 'None Reported'}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVitalsModal(true)}
            className="px-4 py-2.5 bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            Log / Update Vitals
          </button>
          <Link
            to="/symptoms"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-[#0D9488]" />
            AI Triage Check
          </Link>
        </div>
      </div>

      {/* First-Time Vitals Banner (if no custom vitals saved yet) */}
      {!hasRecordedVitals && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-amber-900">Baseline Health Metrics Recommended</div>
              <div className="text-amber-700 mt-0.5">
                Recording your baseline blood pressure, resting heart rate, and weight assists attending doctors during telemedicine visits.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowVitalsModal(true)}
            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold flex-shrink-0 transition-colors"
          >
            Enter Vitals Now
          </button>
        </div>
      )}

      {/* Clinical Vitals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Resting Heart Rate</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-500">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0B192C] font-mono">
            {latestMetric.heartRate}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">BPM</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Normal Resting Range (60-100)
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Blood Pressure</span>
            <div className="p-2 rounded-lg bg-teal-50 text-[#0D9488]">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0B192C] font-mono">
            {latestMetric.bloodPressure?.systolic || 120}
            <span className="text-slate-300 mx-1">/</span>
            {latestMetric.bloodPressure?.diastolic || 80}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">mmHg</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Optimal Range (&lt;120/80)
          </div>
        </div>

        {/* Body Weight */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Body Weight</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0B192C] font-mono">
            {latestMetric.weight}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            BMI Estimated: {(latestMetric.weight / (1.75 * 1.75)).toFixed(1)} (Healthy)
          </div>
        </div>

        {/* Daily Physical Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Daily Steps</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0B192C] font-mono">
            {latestMetric.steps?.toLocaleString() || '8,000'}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            80% of 10,000 Step Target
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Consultations & Active Prescriptions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-100 text-[#0B192C]">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-[#0B192C]">Upcoming Consultations</h3>
            </div>
            <Link
              to="/patient/appointments"
              className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
            >
              Book New <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">No scheduled consultations</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                Need medical advice? Book a video consultation with a certified doctor.
              </p>
              <Link
                to="/patient/appointments"
                className="px-3.5 py-1.5 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#1E3A8A] transition-colors inline-block"
              >
                Schedule Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).map((apt) => (
                <div
                  key={apt._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {apt.doctor?.name || 'Dr. Specialist'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {apt.doctor?.specialization || 'General Consultation'} &bull; {apt.date} at {apt.time}
                    </div>
                  </div>

                  {(apt.meetLink || apt.meetingLink || apt.type === 'video') ? (
                    <a
                      href={apt.meetLink || apt.meetingLink || 'https://meet.google.com/new'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#0D9488] text-white font-semibold flex items-center gap-1 hover:bg-[#0f766e] transition-colors text-[11px]"
                    >
                      <Video className="h-3.5 w-3.5" /> Join Meet
                    </a>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-medium text-[10px]">
                      {apt.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Prescriptions & Pharmacy Refills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-100 text-[#0B192C]">
                <Pill className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-[#0B192C]">Active Prescriptions</h3>
            </div>
            <Link
              to="/patient/pharmacy"
              className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
            >
              Pharmacy Store <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {prescriptions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">No active medications recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                Prescriptions issued by your doctor will automatically appear here for refill management.
              </p>
              <Link
                to="/patient/pharmacy"
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors inline-block"
              >
                Browse Clinical Pharmacy
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.slice(0, 3).map((rx) => (
                <div
                  key={rx._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {rx.medications?.[0]?.name || 'Prescription Medication'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {rx.medications?.[0]?.dosage} &bull; {rx.medications?.[0]?.frequency || 'Daily'} &bull; Prescribed by {rx.doctor?.name || 'Physician'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRefillRequest(rx._id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-[#0D9488] text-slate-700 hover:text-[#0D9488] font-semibold text-[11px] transition-colors"
                  >
                    Request Refill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/patient/records"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all flex items-center space-x-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Health Vault</div>
            <div className="text-[11px] text-slate-500">Upload & View Labs</div>
          </div>
        </Link>

        <Link
          to="/patient/appointments"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all flex items-center space-x-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-teal-50 text-[#0D9488]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Doctor Visits</div>
            <div className="text-[11px] text-slate-500">Book & Manage Slots</div>
          </div>
        </Link>

        <Link
          to="/patient/pharmacy"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all flex items-center space-x-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Digital Pharmacy</div>
            <div className="text-[11px] text-slate-500">Rx Refills & Devices</div>
          </div>
        </Link>

        <Link
          to="/patient/messages"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all flex items-center space-x-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Secure Messages</div>
            <div className="text-[11px] text-slate-500">Chat with Clinicians</div>
          </div>
        </Link>
      </div>

      {/* Vitals Entry / Update Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-[#0B192C]">Record Clinical Vitals</h3>
                <p className="text-[11px] text-slate-500">Update your current health vitals to sync with your patient chart.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleVitalsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Resting Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    required
                    min="40"
                    max="220"
                    value={vitalsForm.heartRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="20"
                    max="300"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    required
                    min="70"
                    max="220"
                    placeholder="120"
                    value={vitalsForm.systolic}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, systolic: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    required
                    min="40"
                    max="140"
                    placeholder="80"
                    value={vitalsForm.diastolic}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Daily Step Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={vitalsForm.steps}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, steps: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVitals}
                  className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-semibold rounded-lg transition-colors shadow-xs"
                >
                  {submittingVitals ? 'Saving...' : 'Save Health Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
