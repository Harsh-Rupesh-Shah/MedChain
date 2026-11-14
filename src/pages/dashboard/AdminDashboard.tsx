import React, { useState, useEffect } from 'react';
import { Check, X, Eye, ExternalLink, FileText } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface DoctorVerification {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  idCardImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const AdminDashboard = () => {
  const [pendingDoctors, setPendingDoctors] = useState<DoctorVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorVerification | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    loadPendingDoctors();
  }, []);

  const loadPendingDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pending-doctors');
      setPendingDoctors(response.data);
    } catch (error) {
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/uploads')) return path;
    if (path.startsWith('uploads/')) return `/${path}`;
    return `/uploads/doctor-ids/${path.replace(/^\/+/, '')}`;
  };

  const isPdf = (path?: string) => {
    return path?.toLowerCase().endsWith('.pdf');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleVerification = async (doctorId: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/admin/verify-doctor/${doctorId}`, { status });
      toast.success(`Doctor ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      loadPendingDoctors();
      setSelectedDoctor(null);
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Doctor Verifications</h1>

      <div className="grid grid-cols-1 gap-6">
        {pendingDoctors.map((doctor) => (
          <div key={doctor._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{doctor.name}</h2>
                <p className="text-sm text-slate-600">{doctor.email}</p>
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Specialization:</span> {doctor.specialization}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">License Number:</span> {doctor.licenseNumber}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Experience:</span> {doctor.experience} years
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Applied on:</span>{' '}
                    {formatDate(doctor.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setImgError(false);
                    setSelectedDoctor(doctor);
                  }}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  title="View Verification Document"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleVerification(doctor._id, 'approved')}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
                  title="Approve Doctor"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleVerification(doctor._id, 'rejected')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  title="Reject Doctor"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {pendingDoctors.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            No pending verifications
          </div>
        )}
      </div>

      {/* ID Card Preview Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Professional Verification Document</h3>
                <p className="text-xs text-slate-500">{selectedDoctor.name} &bull; License: {selectedDoctor.licenseNumber}</p>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-[300px] max-h-[500px] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2 relative">
              {isPdf(selectedDoctor.idCardImage) ? (
                <div className="text-center p-6 space-y-3">
                  <FileText className="h-16 w-16 text-indigo-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-700">PDF Verification Credential</p>
                  <a
                    href={getMediaUrl(selectedDoctor.idCardImage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> Open PDF in New Tab
                  </a>
                </div>
              ) : imgError ? (
                <div className="text-center p-6 space-y-3">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600">Document available at direct storage link.</p>
                  <a
                    href={getMediaUrl(selectedDoctor.idCardImage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open File Link
                  </a>
                </div>
              ) : (
                <img
                  src={getMediaUrl(selectedDoctor.idCardImage)}
                  alt="Doctor ID Card"
                  className="w-full h-full object-contain max-h-[460px] rounded"
                  onError={() => setImgError(true)}
                />
              )}
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between items-center">
              <a
                href={getMediaUrl(selectedDoctor.idCardImage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open full image
              </a>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleVerification(selectedDoctor._id, 'rejected')}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleVerification(selectedDoctor._id, 'approved')}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                >
                  Approve Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;