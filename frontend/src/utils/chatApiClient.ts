import axios from 'axios';
import { CHAT_API_BASE_URL } from '../config';
import { getAuthToken } from '../services/authService';

const chatApiClient = axios.create({
  baseURL: CHAT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

chatApiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

chatApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Chat API Request Error:', {
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

export default chatApiClient;