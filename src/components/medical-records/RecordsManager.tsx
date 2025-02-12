import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Search, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface MedicalRecord {
  id: string;
  type: 'prescription' | 'lab_result' | 'diagnosis' | 'vaccination';
  title: string;
  date: string;
  doctor: string;
  description: string;
  attachments: string[];
}

const RecordsManager = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newRecord, setNewRecord] = useState({
    type: 'prescription' as MedicalRecord['type'],
    title: '',
    date: new Date().toISOString().split('T')[0],
    doctor: '',
    description: '',
    attachments: [] as string[]
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/records');
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleAddRecord = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('type', newRecord.type);
      formData.append('title', newRecord.title);
      formData.append('date', newRecord.date);
      
      // Only append doctor if it's being added by a doctor
      if (newRecord.doctor.trim()) {
        // Skip adding doctor field for patient-added records
        // This will make the field optional in the backend
      }
      
      formData.append('description', newRecord.description);

      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await api.post('/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Medical record added successfully');
      setShowAddModal(false);
      loadRecords();
      setNewRecord({
        type: 'prescription',
        title: '',
        date: new Date().toISOString().split('T')[0],
        doctor: '',
        description: '',
        attachments: []
      });
      setSelectedFiles([]);
    } catch (error) {
      toast.error('Failed to add medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/patients/records/${id}`);
      toast.success('Record deleted successfully');
      setRecords(records.filter(record => record.id !== id));
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Medical Records</h2>
        <button 
          className="btn-primary flex items-center"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Record
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search records..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="border rounded-lg p-4 hover:bg-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{record.title}</h3>
                  <p className="text-sm text-slate-600">
                    Dr. {record.doctor} • {new Date(record.date).toLocaleDateString()}
                  </p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800 mt-2">
                    {record.type}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-slate-200 rounded-full">
                    <Download className="h-5 w-5 text-slate-600" />
                  </button>
                  <button 
                    className="p-2 hover:bg-red-100 rounded-full"
                    onClick={() => handleDelete(record.id)}
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-slate-700">{record.description}</p>
              {record.attachments.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {record.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center text-sm text-indigo-600">
                      <FileText className="h-4 w-4 mr-1" />
                      Attachment {index + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Medical Record</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Record Type
                </label>
                <select
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value as MedicalRecord['type'] })}
                  className="input-field"
                >
                  <option value="prescription">Prescription</option>
                  <option value="lab_result">Lab Result</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="vaccination">Vaccination</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter record title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={newRecord.doctor}
                  onChange={(e) => setNewRecord({ ...newRecord, doctor: e.target.value })}
                  className="input-field"
                  placeholder="Enter doctor's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="Enter record description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Attachments
                </label>
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer"
                  onClick={handleBrowseClick}
                >
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    Click to browse or drag and drop files here
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <span className="text-sm text-slate-600">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleAddRecord}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Adding Record...' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsManager;