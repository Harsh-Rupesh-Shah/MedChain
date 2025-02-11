import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred';

    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || 'Server error';
      
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        errorMessage = 'Session expired. Please login again.';
      }
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'No response from server. Please check your connection.';
    }

    toast.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const auth = {
  register: async (data: any) => {
    try {
      const response = await api.post('/auth/register', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  login: async (data: any) => {
    try {
      const response = await api.post('/auth/login', data);
      
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response from server');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  verifyFace: async (faceImage: File) => {
    try {
      const formData = new FormData();
      formData.append('face', faceImage);
      
      const response = await api.post('/patients/verify-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response from server');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  verifyDoctorId: async (idCard: File) => {
    try {
      const formData = new FormData();
      formData.append('idCard', idCard);
      
      const response = await api.post('/doctors/verify-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (!response.data?.verified) {
        throw new Error('ID verification failed');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default api;