import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  verify: async () => {
    const response = await api.post('/auth/verify');
    return response.data;
  }
};

// Devices API
export const devicesAPI = {
  getAll: async () => {
    const response = await api.get('/devices');
    return response.data;
  },
  
  getDevice: async (id) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },
  
  getDeviceData: async (id, limit = 10) => {
    const response = await api.get(`/devices/${id}/data?limit=${limit}`);
    return response.data;
  }
};

// Health API
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api;
