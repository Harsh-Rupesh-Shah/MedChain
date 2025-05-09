// pages/auth/Login.tsx
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Face } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
// import api from '../../services/api';
import FaceRecognition from '../../components/FaceRecognition';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithToken, verifyFace } = useAuth();
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [loginMethod, setLoginMethod] = useState<'face' | 'credentials'>('credentials');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFaceImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(formData.email, formData.password, activeTab);
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!faceImage || !formData.email) {
        toast.error('Please provide both email and face image');
        return;
      }
  
      // Show immediate feedback
      toast.loading('Processing face verification...', { id: 'face-login' });
  
      // Convert and compress image
      const compressedImage = await compressImage(faceImage);
      const file = new File([compressedImage], 'face.jpg', { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });
  
      await verifyFace(formData.email, file);
      toast.success('Face verification successful!', { id: 'face-login' });
      
    } catch (err) {
      toast.error(err.message || 'Face verification failed', { id: 'face-login' });
    } finally {
      setLoading(false);
    }
  };
  
  // Add this helper function
  const compressImage = async (dataUrl: string, quality = 0.7) => {
    return new Promise<Blob>((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
      };
    });
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-indigo-50 to-emerald-50">
      <div className="container-custom">
        <div className="auth-form">
          <h2 className="text-2xl font-bold text-center mb-8">Welcome Back</h2>

          {/* Login Type Tabs */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              className={`auth-tab flex-1 ${activeTab === 'patient' ? 'active' : ''}`}
              onClick={() => setActiveTab('patient')}
            >
              Patient Login
            </button>
            <button
              className={`auth-tab flex-1 ${activeTab === 'doctor' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('doctor');
                setLoginMethod('credentials');
              }}
            >
              Doctor Login
            </button>
            <button
              className={`auth-tab flex-1 ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('admin');
                setLoginMethod('credentials');
              }}
            >
              Admin Login
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'patient' && (
            <div className="mb-6">
              <div className="flex justify-center space-x-4">
                <button
                  className={`px-4 py-2 rounded-lg ${loginMethod === 'credentials'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-slate-700'
                    }`}
                  onClick={() => setLoginMethod('credentials')}
                >
                  Email & Password
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${loginMethod === 'face'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-slate-700'
                    }`}
                  onClick={() => setLoginMethod('face')}
                >
                  Face Recognition
                </button>
              </div>
            </div>
          )}

          {activeTab === 'patient' && loginMethod === 'credentials' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {activeTab === 'patient' && loginMethod === 'face' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <h3 className="text-lg font-semibold">Face Recognition Login</h3>
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
                    placeholder="Enter your registered email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4">
                {faceImage ? (
                  <div className="flex items-center">
                    <img
                      src={faceImage}
                      alt="Face Preview"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <button
                      onClick={handleFaceLogin}
                      className="btn-primary ml-4"
                      disabled={loading || !faceImage}
                    >
                      {loading ? 'Verifying...' : 'Verify Face'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFaceCapture(true)}
                    className="btn-primary"
                  >
                    Capture Face
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'patient' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {activeTab !== 'admin' && (
            <div className="mt-4 text-center">
              <Link to={activeTab === 'doctor' ? '/doctor/register' : '/patient/register'}
                className="text-indigo-600 hover:text-indigo-700">
                New {activeTab === 'doctor' ? 'Doctor' : 'Patient'}? Register here
              </Link>
            </div>
          )}
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

export default Login;