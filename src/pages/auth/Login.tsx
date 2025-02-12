import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FaceRecognition from '../../components/FaceRecognition';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [loginMethod, setLoginMethod] = useState<'face' | 'credentials'>('credentials');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(formData.email, formData.password, activeTab);
    } catch (err: any) {
      const message = err.message || 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async (image: File) => {
    try {
      setLoading(true);
      setError('');
      const { verifyFace } = useAuth();
      await verifyFace(image);
    } catch (err: any) {
      const message = err.message || 'Face verification failed';
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
          <h2 className="text-2xl font-bold text-center mb-8">Welcome Back</h2>
          
          {/* Login Type Tabs */}
          <div className="flex mb-8 border-b border-slate-200">
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
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {activeTab === 'patient' && (
            <div className="mb-6">
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  className={`px-4 py-2 rounded-lg ${
                    loginMethod === 'credentials'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-slate-700'
                  }`}
                  onClick={() => setLoginMethod('credentials')}
                >
                  Email & Password
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${
                    loginMethod === 'face'
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

          {(activeTab !== 'patient' || (activeTab === 'patient' && loginMethod === 'credentials')) && (
            <form onSubmit={handleCredentialsLogin}>
              <div className="space-y-4">
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
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
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
              </div>
            </form>
          )}

          {activeTab === 'patient' && loginMethod === 'face' && (
            <FaceRecognition onCapture={handleFaceLogin} mode="verify" />
          )}

          {activeTab !== 'admin' && (
            <div className="mt-4 text-center">
              <Link 
                to={activeTab === 'doctor' ? '/doctor/register' : '/patient/register'} 
                className="text-indigo-600 hover:text-indigo-700"
              >
                New {activeTab}? Register here
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;