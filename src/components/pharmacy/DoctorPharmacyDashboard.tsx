import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Plus, FileText, Clock, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Patient {
  _id: string;
  name: string;
}

interface Prescription {
  _id: string;
  patient: Patient;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[];
  date: string;
  status: 'active' | 'completed' | 'cancelled';
}

const DoctorPharmacyDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState([{
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  }]);

  useEffect(() => {
    loadPatients();
    loadPrescriptions();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await api.get('/doctors/patients');
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to load patients');
    }
  };

  const loadPrescriptions = async () => {
    try {
      const response = await api.get('/doctors/prescriptions');
      setPrescriptions(response.data);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    }
  };

  const addMedication = () => {
    setMedications([...medications, {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setMedications(updatedMedications);
  };

  const handlePrescribe = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (medications.some(med => !med.name || !med.dosage)) {
      toast.error('Please fill in all required medication fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/doctors/prescriptions', {
        patientId: selectedPatient,
        medications
      });

      toast.success('Prescription created successfully');
      setShowPrescribeModal(false);
      loadPrescriptions();
      
      // Reset form
      setSelectedPatient('');
      setMedications([{
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      }]);
    } catch (error) {
      toast.error('Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pharmacy Dashboard</h2>
        <button
          onClick={() => setShowPrescribeModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Prescription
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.map((prescription) => (
          <div key={prescription._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{prescription.patient.name}</h3>
                <p className="text-sm text-slate-600">
                  {new Date(prescription.date).toLocaleDateString()}
                </p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                  prescription.status === 'active' ? 'bg-green-100 text-green-700' :
                  prescription.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {prescription.status}
                </span>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-full">
                <FileText className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-3">
              {prescription.medications.map((med, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{med.name}</h4>
                      <p className="text-sm text-slate-600">
                        {med.dosage} • {med.frequency}
                      </p>
                      {med.duration && (
                        <p className="text-sm text-slate-600">
                          Duration: {med.duration}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-slate-400 mr-1" />
                      <span className="text-sm text-slate-600">
                        {med.frequency}
                      </span>
                    </div>
                  </div>
                  {med.notes && (
                    <p className="text-sm text-slate-600 mt-2">
                      Notes: {med.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Prescribe Modal */}
      {showPrescribeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">New Prescription</h3>
              <button onClick={() => setShowPrescribeModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Patient
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {medications.map((medication, index) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-lg relative">
                    {index > 0 && (
                      <button
                        onClick={() => removeMedication(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Medication Name
                        </label>
                        <input
                          type="text"
                          value={medication.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          className="input-field"
                          placeholder="Enter medication name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 500mg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Frequency
                        </label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Twice daily"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 7 days"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={medication.notes}
                          onChange={(e) => handleMedicationChange(index, 'notes', e.target.value)}
                          className="input-field"
                          placeholder="Add any special instructions or notes"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMedication}
                  className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-500"
                >
                  Add Another Medication
                </button>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPrescribeModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrescribe}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Creating Prescription...' : 'Create Prescription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPharmacyDashboard;