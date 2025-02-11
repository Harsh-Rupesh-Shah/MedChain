import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  role: 'patient' | 'doctor';
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  verifyFace: (image: File) => Promise<void>;
  verifyDoctorId: (image: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await auth.getCurrentUser();
      if (response.data) {
        setUser(response.data);
        connectSocket();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const response = await auth.register(userData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await auth.login({ email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setUser(user);
      connectSocket();

      toast.success('Login successful!');
      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    disconnectSocket();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const verifyFace = async (image: File) => {
    try {
      setLoading(true);
      const response = await auth.verifyFace(image);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setUser(user);
      connectSocket();

      navigate('/patient/dashboard');
      toast.success('Face verification successful!');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyDoctorId = async (image: File) => {
    try {
      setLoading(true);
      const response = await auth.verifyDoctorId(image);
      toast.success('ID verified successfully');
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        verifyFace,
        verifyDoctorId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};