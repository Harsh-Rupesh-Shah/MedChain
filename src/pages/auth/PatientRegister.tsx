// pages/auth/PatientRegister.tsx
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Calendar, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import FaceRecognition from '../../components/FaceRecognition';

const PatientRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
  });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFaceCapture = (image: string) => {
    setFaceImage(image);
    setShowFaceCapture(false);
  };

  const handleCancelFaceCapture = () => {
    setShowFaceCapture(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    if (!faceImage) {
      setError('Please capture your face image');
      return;
    }
  
    try {
      setLoading(true);
      
      // Convert base64 image to a file
      const blob = await fetch(faceImage).then(r => r.blob());
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('biometricData', file);
  
      const response = await api.post('auth/patient/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-indigo-50 to-emerald-50">
      <div className="container-custom">
        <div className="auth-form">
          <h2 className="text-2xl font-bold text-center mb-8">Patient Registration</h2>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  className="input-field pl-10"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  className="input-field pl-10"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  className="input-field pl-10"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  className="input-field pl-10"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  className="input-field pl-10"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input-field pl-10"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Face Recognition
              </label>
              {!faceImage ? (
                <button
                  type="button"
                  onClick={() => setShowFaceCapture(true)}
                  className="w-full btn-primary"
                >
                  Capture Face
                </button>
              ) : (
                <div className="flex justify-center space-x-4">
                  <img
                    src={faceImage}
                    alt="Face Preview"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <button
                    onClick={() => setShowFaceCapture(true)}
                    className="btn-secondary"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
              Already have an account? Login here
            </Link>
          </div>
        </div>
      </div>

      {showFaceCapture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-md">
            <FaceRecognition
              onSuccess={(image) => {
                setFaceImage(image);
                setShowFaceCapture(false);
              }}
              onCancel={() => setShowFaceCapture(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRegister;