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
      const response = await api.post('/auth/login', credentials);
      const { token, username, role } = response.data;
    
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username, role }));
    
      return { username, role } as User;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Authentication failed. Please check your credentials.');
    }
  },
 
  register: async (userData: RegisterData): Promise<User> => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, username, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username, role }));

      return { username, role } as User;
    } catch (error) {
      console.error('Registration error:', error);
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
