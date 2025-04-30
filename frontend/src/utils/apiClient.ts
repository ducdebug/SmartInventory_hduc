import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../services/authService';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Request Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.response) {
      if (error.response.status === 401) {
        console.warn('Authentication token expired or invalid');
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } 
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;