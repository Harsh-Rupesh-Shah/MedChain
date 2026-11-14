import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, FileText, Eye, X, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Patient {
  _id: string;
  name: string;
}

interface MedicalRecord {
  _id: string;
  type: string;
  title: string;
  date: string;
  description: string;
  attachments: {
    filename: string;
    originalName: string;
    path: string;
    mimetype: string;
  }[];
  patient: Patient;
  doctor: {
    _id: string;
    name: string;
  };
}

const MedicalRecordsViewer = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recordType, setRecordType] = useState('all');
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
    isPdf: boolean;
    isImage: boolean;
  } | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadRecords(selectedPatient);
    } else {
      setRecords([]);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (patientId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/patients/${patientId}/records`);
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to load medical records:', error);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (recordId: string, filename: string) => {
    try {
      const response = await api.get(`/medical-records/${recordId}/download/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleView = async (recordId: string, filename: string, originalName?: string) => {
    try {
      const isPdf = filename.toLowerCase().endsWith('.pdf') || (originalName?.toLowerCase().endsWith('.pdf') ?? false);
      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(filename) || /\.(jpg|jpeg|png|webp|gif)$/i.test(originalName || '');

      const response = await api.get(`/medical-records/${recordId}/download/${filename}`, {
        responseType: 'blob'
      });
      const mime = isPdf ? 'application/pdf' : (isImage ? 'image/jpeg' : response.data.type || 'application/octet-stream');
      const blob = new Blob([response.data], { type: mime });
      const blobUrl = window.URL.createObjectURL(blob);

      setPreviewDoc({
        url: blobUrl,
        name: originalName || filename,
        isPdf,
        isImage
      });
    } catch (error) {
      console.error('Failed to view file:', error);
      toast.error('Failed to open document preview');
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = recordType === 'all' || record.type === recordType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Medical Records</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Patient</option>
            {patients.map(patient => (
              <option key={patient._id} value={patient._id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPatient && (
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="prescription">Prescriptions</option>
            <option value="lab_result">Lab Results</option>
            <option value="diagnosis">Diagnoses</option>
            <option value="vaccination">Vaccinations</option>
            <option value="other">Other</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : selectedPatient ? (
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div key={record._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{record.title}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800 mt-2">
                      {record.type}
                    </span>
                  </div>
                </div>
                
                <p className="mt-4 text-slate-700">{record.description}</p>

                {record.attachments && record.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="font-medium text-sm">Attachments:</p>
                    {record.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm font-medium text-slate-800">{attachment.originalName || attachment.filename}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(record._id, attachment.filename, attachment.originalName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                            title="View Document"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            onClick={() => handleDownload(record._id, attachment.filename)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                            title="Download Document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-slate-500">No medical records found for this patient</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-slate-500">Please select a patient to view their medical records</p>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Patient Clinical Document</h3>
                <p className="text-xs text-slate-500">{previewDoc.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                  title="Open in new window"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[400px] max-h-[600px] bg-slate-50 rounded-lg border overflow-hidden flex items-center justify-center">
              {previewDoc.isPdf ? (
                <iframe
                  src={previewDoc.url}
                  title="PDF Document"
                  className="w-full h-full min-h-[500px]"
                />
              ) : previewDoc.isImage ? (
                <img
                  src={previewDoc.url}
                  alt="Medical Document"
                  className="max-w-full max-h-[540px] object-contain rounded"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-700">{previewDoc.name}</p>
                  <a
                    href={previewDoc.url}
                    download={previewDoc.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsViewer;