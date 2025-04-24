import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create a shared axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL
});

// Add token to all requests if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;