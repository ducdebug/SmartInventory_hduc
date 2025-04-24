import axios from 'axios';
import apiClient from '../utils/apiClient';
import { User, LoginCredentials, RegisterData } from '../types/auth';

const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      // For login, we use the base axios since we don't have a token yet
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
      // For register, we use the base axios since we don't have a token yet
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