import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  FileText,
  X,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DoctorRegister: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    experience: '',
    idCardImage: null as File | null
  });

  const specializations = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'General Medicine',
    'Neurology',
    'Obstetrics and Gynecology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Urology'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        idCardImage: file
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      idCardImage: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.specialization) {
      setError('Please select a specialization');
      toast.error('Please select a specialization');
      return;
    }

    if (!formData.idCardImage) {
      setError('Please upload your Medical License / ID Card for credential verification');
      toast.error('Please upload your Medical License / ID Card');
      return;
    }

    try {
      setLoading(true);
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('email', formData.email);
      formDataObj.append('password', formData.password);
      formDataObj.append('phone', formData.phone);
      formDataObj.append('specialization', formData.specialization);
      formDataObj.append('licenseNumber', formData.licenseNumber);
      formDataObj.append('experience', formData.experience);
      formDataObj.append('idCardImage', formData.idCardImage);

      await api.post('/auth/doctor/register', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Registration submitted! Account is pending administrative credential review.');
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-[#F8FAFC]">
      <div className="container-custom max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#0B192C] text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#0B192C]">Physician Credential Intake</h2>
            <p className="text-xs text-slate-500 mt-1">
              Join MedChain's accredited clinical network. All applications undergo ABMS and state licensure verification.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Legal Name (with MD/DO/MBBS) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  placeholder="e.g. Dr. Jonathan R. Vance, MD"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Professional Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    placeholder="doctor@hospital.org"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Direct Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    placeholder="(555) 012-3456"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Specialization <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="specialization"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Specialization...</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Years of Practice <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="experience"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  placeholder="e.g. 10"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                State Medical License / NPI Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="licenseNumber"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  placeholder="e.g. MD-982148 or NPI #1942093104"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Redesigned Clinical Upload Area */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Medical License or Hospital ID Document <span className="text-red-500">*</span>
              </label>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#0D9488] bg-slate-50/60 hover:bg-slate-50 rounded-xl p-6 text-center cursor-pointer transition-all group"
                >
                  <input
                    type="file"
                    name="idCardImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 group-hover:border-[#0D9488] flex items-center justify-center mx-auto mb-2 text-slate-500 group-hover:text-[#0D9488] shadow-xs transition-colors">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-slate-800 mb-0.5">
                    Click to select medical ID document
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Supports high-resolution JPG, PNG or photo of state license / hospital badge
                  </div>
                </div>
              ) : (
                <div className="relative border border-emerald-200 bg-emerald-50/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={imagePreview}
                      alt="ID Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-emerald-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>{formData.idCardImage?.name || 'Medical-License-Attached'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formData.idCardImage ? `${(formData.idCardImage.size / 1024).toFixed(1)} KB` : 'Verified Image File'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearImage}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                    title="Remove File"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                disabled={loading}
              >
                {loading ? 'Submitting Credentials...' : 'Submit Physician Registration'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already verified on MedChain?{' '}
            <Link to="/login" className="text-[#0D9488] font-semibold hover:underline">
              Sign In to Provider Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;
