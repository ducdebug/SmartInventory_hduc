import axios from 'axios';
import { User, LoginCredentials, RegisterData } from '../types/auth';
import { API_BASE_URL } from '../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add token to all requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Login successful response:', response.data);
      const { token, username, role } = response.data;
    
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username, role }));
    
      return { username, role } as User;
    } catch (error: any) {
      console.error('Login error details:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        throw new Error(typeof error.response.data === 'string' ? error.response.data : 'Authentication failed');
      }
      throw new Error('Authentication failed. Please check your credentials and connectivity.');
    }
  },
 
  register: async (userData: RegisterData): Promise<User> => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const { token, username, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username, role }));

      return { username, role } as User;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response && error.response.data) {
        throw new Error(typeof error.response.data === 'string' ? error.response.data : 'Registration failed');
      }
      throw new Error('Registration failed. Please try again.');
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      if (!user.username || !user.role) return null;
      
      return user as User;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};

export default authService;