import React, { useState, useEffect } from 'react';
import { Check, X, Eye } from 'lucide-react';
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
                    {new Date(doctor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedDoctor(doctor)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleVerification(doctor._id, 'approved')}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleVerification(doctor._id, 'rejected')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ID Card Preview</h3>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="aspect-video relative">
              <img
                src={selectedDoctor.idCardImage}
                alt="Doctor ID Card"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => handleVerification(selectedDoctor._id, 'rejected')}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Reject
              </button>
              <button
                onClick={() => handleVerification(selectedDoctor._id, 'approved')}
                className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;