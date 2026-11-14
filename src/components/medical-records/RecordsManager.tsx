import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Plus,
  X,
  User,
  Calendar,
  CheckCircle2,
  FileCheck,
  Stethoscope
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface MedicalRecord {
  _id?: string;
  id?: string;
  type: 'prescription' | 'lab_result' | 'diagnosis' | 'vaccination';
  title: string;
  date: string;
  doctor: any;
  description: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    path: string;
    mimetype?: string;
  }>;
}

interface DoctorOption {
  _id: string;
  name: string;
  specialization: string;
}

const RecordsManager: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [doctorsList, setDoctorsList] = useState<DoctorOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDoctorChoice, setSelectedDoctorChoice] = useState('');
  const [customDoctorName, setCustomDoctorName] = useState('');

  const [newRecord, setNewRecord] = useState({
    type: 'prescription' as MedicalRecord['type'],
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    loadRecords();
    loadDoctors();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/records');
      if (Array.isArray(response.data)) {
        setRecords(response.data);
      }
    } catch (error) {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      if (Array.isArray(response.data)) {
        setDoctorsList(response.data);
      }
    } catch (error) {
      console.warn('Doctors directory load notice:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      let finalDoctor = selectedDoctorChoice;
      if (selectedDoctorChoice === 'custom') {
        finalDoctor = customDoctorName.trim();
      }
      if (!finalDoctor) {
        finalDoctor = 'Attending Physician';
      }

      const formData = new FormData();
      formData.append('type', newRecord.type);
      formData.append('title', newRecord.title);
      formData.append('date', newRecord.date);
      formData.append('doctor', finalDoctor);
      formData.append('description', newRecord.description);

      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post('/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Medical record encrypted and saved to your health vault!');
      setShowAddModal(false);
      loadRecords();

      // Reset form
      setNewRecord({
        type: 'prescription',
        title: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setSelectedDoctorChoice('');
      setCustomDoctorName('');
      setSelectedFiles([]);
    } catch (error) {
      toast.error('Failed to add medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: MedicalRecord) => {
    const recordId = record._id || record.id;
    if (!recordId) return;

    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await api.delete(`/medical-records/${recordId}`);
      toast.success('Record removed from vault');
      setRecords((prev) => prev.filter((r) => (r._id || r.id) !== recordId));
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const getDoctorDisplay = (doc: any): string => {
    if (!doc) return 'Attending Physician';
    if (typeof doc === 'object' && doc !== null) {
      return doc.name || 'Attending Physician';
    }
    if (typeof doc === 'string') {
      return doc.startsWith('Dr.') ? doc : `Dr. ${doc}`;
    }
    return String(doc);
  };

  const filteredRecords = records.filter((r) => {
    const docName = getDoctorDisplay(r.doctor).toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docName.includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedTypeFilter === 'all' || r.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Cryptographic Vault</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              HIPAA SECURE
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#0B192C]">Medical Records & Prescriptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescriptions, laboratory diagnostic reports, and clinical consultation records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          Upload New Record
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by diagnosis, doctor name, medication..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'prescription', label: 'Prescriptions' },
            { id: 'lab_result', label: 'Lab Reports' },
            { id: 'diagnosis', label: 'Clinical Diagnoses' },
            { id: 'vaccination', label: 'Vaccinations' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTypeFilter(type.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedTypeFilter === type.id
                  ? 'bg-[#0B192C] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
          <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-sm text-slate-800">No medical records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Upload your handwritten or digital prescriptions, blood work, or specialist diagnoses to keep them secured in your vault.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-lg hover:bg-[#1E3A8A] transition-colors"
          >
            Upload Prescription / Lab
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const recordId = record._id || record.id || '';
            const doctorDisplay = getDoctorDisplay(record.doctor);

            return (
              <div
                key={recordId}
                className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[#0D9488] flex-shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-[#0B192C]">{record.title}</h3>
                      <span className="capitalize px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                        {record.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-[#0D9488]">
                        <Stethoscope className="h-3.5 w-3.5" />
                        {doctorDisplay}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(record.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {record.description && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-xl">
                        {record.description}
                      </p>
                    )}

                    {/* Attachments preview */}
                    {record.attachments && record.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {record.attachments.map((file, idx) => {
                          const token = localStorage.getItem('token') || '';
                          const fileUrl = `/api/medical-records/${recordId}/download/${file.filename}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                          return (
                            <a
                              key={idx}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors border border-slate-200"
                              title="Click to view/download attachment"
                            >
                              <Download className="h-3 w-3 text-slate-500" />
                              <span>{file.originalName || file.filename}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(record)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-base text-[#0B192C]">Upload Medical Record / Prescription</h3>
                <p className="text-[11px] text-slate-500">Record will be encrypted and stored in your vault.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Record Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRecord.type}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, type: e.target.value as MedicalRecord['type'] })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  >
                    <option value="prescription">Prescription</option>
                    <option value="lab_result">Laboratory / Blood Test</option>
                    <option value="diagnosis">Specialist Diagnosis</option>
                    <option value="vaccination">Vaccination Record</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Encounter Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Title or Diagnosis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin Rx for Sinusitis, or Lipid Panel Test"
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              {/* Doctor Selector Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prescribing / Attending Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedDoctorChoice}
                  onChange={(e) => setSelectedDoctorChoice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="">Select Doctor from MedChain Network...</option>
                  {doctorsList.map((doc) => (
                    <option key={doc._id} value={doc.name}>
                      {doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`} ({doc.specialization || 'Medicine'})
                    </option>
                  ))}
                  <option value="Dr. Sarah Miller">Dr. Sarah Miller (Cardiology)</option>
                  <option value="Dr. Eleanor Vance">Dr. Eleanor Vance, MD (Cardiology)</option>
                  <option value="Dr. Marcus Thorne">Dr. Marcus Thorne, MD (Orthopedics)</option>
                  <option value="Dr. Priya Nair">Dr. Priya Nair, MD (Pediatrics)</option>
                  <option value="custom">+ Other / Outside Clinic Doctor</option>
                </select>

                {selectedDoctorChoice === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      placeholder="Enter outside doctor's full name (e.g. Dr. Robert Chen)"
                      value={customDoctorName}
                      onChange={(e) => setCustomDoctorName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes / Clinical Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Dosage details, physician recommendations, follow-up schedule..."
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Attach Prescription File / Lab PDF / Photo
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#0D9488] bg-slate-50/70 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-slate-700 font-semibold text-xs">Click to browse files</p>
                  <p className="text-[10px] text-slate-500">Supports PDF, JPG, PNG up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px]"
                      >
                        <span className="truncate text-slate-700 font-medium">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {loading ? 'Encrypting & Saving...' : 'Save to Health Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsManager;
