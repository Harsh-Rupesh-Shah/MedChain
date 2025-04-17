import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, Calendar, AlertCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Prescription {
  _id: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
    status: 'active' | 'completed';
    nextRefill?: string;
    remainingDays?: number;
  }[];
  doctor: {
    name: string;
    specialization: string;
  };
  date: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface Reminder {
  _id: string;
  medicationName: string;
  time: string;
  taken: boolean;
}

const PatientPharmacyDashboard = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadPrescriptions();
    loadReminders();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/prescriptions');
      setPrescriptions(response.data);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const response = await api.get('/patients/medication-reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const markReminderAsTaken = async (reminderId: string) => {
    try {
      await api.put(`/patients/medication-reminders/${reminderId}/taken`);
      loadReminders();
      toast.success('Medication marked as taken');
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const orderRefill = async (prescriptionId: string) => {
    try {
      await api.post(`/pharmacy/refill/${prescriptionId}`);
      toast.success('Refill order placed successfully');
      setCartCount(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to order refill');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Medications</h2>
        <div className="flex items-center space-x-4">
          <button className="relative">
            <Bell className="h-6 w-6 text-slate-700" />
            {reminders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>
          <button className="relative">
            <ShoppingCart className="h-6 w-6 text-slate-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Medication Reminders */}
      {reminders.length > 0 && (
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 text-indigo-500 mr-2" />
            Medication Reminders
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reminders.map((reminder) => (
              <div key={reminder._id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{reminder.medicationName}</h4>
                    <p className="text-sm text-slate-600">{reminder.time}</p>
                  </div>
                  <button
                    onClick={() => markReminderAsTaken(reminder._id)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      reminder.taken
                        ? 'bg-green-100 text-green-700'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {reminder.taken ? 'Taken' : 'Mark as Taken'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Prescriptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Active Prescriptions</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>

        {prescriptions.map((prescription) => (
          <div key={prescription._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  Prescribed by Dr. {prescription.doctor.name}
                </h3>
                <p className="text-sm text-slate-600">
                  {prescription.doctor.specialization} • {new Date(prescription.date).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                prescription.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : prescription.status === 'completed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {prescription.status}
              </span>
            </div>

            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{medication.name}</h4>
                      <p className="text-sm text-slate-600">
                        {medication.dosage} • {medication.frequency}
                      </p>
                      {medication.duration && (
                        <p className="text-sm text-slate-600">
                          Duration: {medication.duration}
                        </p>
                      )}
                    </div>
                    {medication.remainingDays !== undefined && medication.remainingDays <= 7 && (
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm text-amber-500">
                          {medication.remainingDays} days remaining
                        </span>
                      </div>
                    )}
                  </div>

                  {medication.notes && (
                    <p className="text-sm text-slate-600 mt-2">
                      Notes: {medication.notes}
                    </p>
                  )}

                  {medication.nextRefill && (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Next refill: {new Date(medication.nextRefill).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => orderRefill(prescription._id)}
                        className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200"
                      >
                        Order Refill
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientPharmacyDashboard;