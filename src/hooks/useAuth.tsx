import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'patient' | 'doctor' | 'admin') => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  verifyFace: (email: string, image: File) => Promise<void>;
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
      localStorage.removeItem('user');
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

  const login = async (email: string, password: string, role: 'patient' | 'doctor' | 'admin') => {
    try {
      setLoading(true);
      const response = await auth.login({ email, password }, role); // Make sure this matches your API
      const { token, user } = response.data;
  
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      connectSocket();
  
      toast.success('Login successful!');
      
      // Navigate based on role
      switch (user.role) {
        case 'doctor':
          navigate('/doctor/dashboard', { replace: true });
          break;
        case 'patient':
          navigate('/patient/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
    navigate('/login', { replace: true });
    toast.success('Logged out successfully');
  };

  const verifyFace = async (email: string, image: File) => {
    try {
      setLoading(true);
      const response = await auth.faceLogin(email, image);
      const { token, user } = response.data;
  
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      connectSocket();
  
      navigate('/patient/dashboard', { replace: true });
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

  const loginWithToken = async (token: string) => {
    try {
      setLoading(true);
      localStorage.setItem('token', token);
      const response = await auth.getCurrentUser();
      const user = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      connectSocket();
  
      toast.success('Login successful!');
      
      // Navigate based on role
      switch (user.role) {
        case 'doctor':
          navigate('/doctor/dashboard', { replace: true });
          break;
        case 'patient':
          navigate('/patient/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
      }
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
        loginWithToken,
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

export default useAuth;