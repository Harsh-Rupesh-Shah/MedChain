import React, { useState } from 'react';
import { FileText, Upload, Download, Trash2, Search } from 'lucide-react';

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

  const handleUpload = (files: FileList) => {
    // Handle file upload logic
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter(record => record.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Medical Records</h2>
        <button className="btn-primary flex items-center">
          <Upload className="h-5 w-5 mr-2" />
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

      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} className="border rounded-lg p-4 hover:bg-slate-50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{record.title}</h3>
                <p className="text-sm text-slate-600">
                  Dr. {record.doctor} • {record.date}
                </p>
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
    </div>
  );
};

export default RecordsManager;