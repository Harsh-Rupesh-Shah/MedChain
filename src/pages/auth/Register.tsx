import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import FaceRecognition from '../../components/FaceRecognition';
import DoctorIdVerification from '../../components/DoctorIdVerification';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    role: 'patient' as 'patient' | 'doctor',
    doctorId: '',
    biometricData: null as string | null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBiometricCapture = async (image: File) => {
    try {
      setLoading(true);
      let biometricResponse;

      if (formData.role === 'doctor') {
        const formDataObj = new FormData();
        formDataObj.append('idCard', image);
        
        const response = await fetch('/api/doctors/verify-id', {
          method: 'POST',
          body: formDataObj
        });
        
        if (!response.ok) {
          throw new Error(`Verification failed: ${response.statusText}`);
        }
        
        biometricResponse = await response.json();
        
        if (!biometricResponse.verified) {
          throw new Error('ID verification failed');
        }
        
        setFormData(prev => ({
          ...prev,
          doctorId: biometricResponse.doctorId,
          biometricData: URL.createObjectURL(image)
        }));
      } else {
        // For patients, store the face image
        setFormData(prev => ({
          ...prev,
          biometricData: URL.createObjectURL(image)
        }));
      }
      
      toast.success(`${formData.role === 'doctor' ? 'ID Card' : 'Face'} captured successfully!`);
      setShowBiometrics(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Capture failed';
      toast.error(message);
      console.error('Biometric capture error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (!formData.biometricData) {
        throw new Error(`Please ${formData.role === 'doctor' ? 'upload your ID card' : 'register your face'} before continuing`);
      }

      // Register user
      await register({
        ...formData,
        biometricData: formData.biometricData
      });

      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-indigo-50 to-emerald-50">
      <div className="container-custom">
        <div className="auth-form">
          <h2 className="text-2xl font-bold text-center mb-8">Create Account</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          
          {showBiometrics ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {formData.role === 'patient' ? 'Register Your Face' : 'Upload ID Card'}
              </h3>
              {formData.role === 'patient' ? (
                <FaceRecognition onCapture={handleBiometricCapture} mode="register" />
              ) : (
                <DoctorIdVerification onCapture={handleBiometricCapture} mode="register" />
              )}
              <button
                onClick={() => setShowBiometrics(false)}
                className="mt-4 btn-secondary w-full"
              >
                Back to Form
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Type
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

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
                  Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    className="input-field pl-10"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowBiometrics(true)}
                  className="btn-secondary w-full flex items-center justify-center"
                >
                  {formData.role === 'patient' ? 'Register Face' : 'Upload ID Card'}
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="text-center mt-4">
                <span className="text-slate-600">Already have an account? </span>
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
                  Login here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;