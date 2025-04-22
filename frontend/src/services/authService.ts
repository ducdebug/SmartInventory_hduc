import axios from 'axios';
import { User } from '../types/auth';

const API_BASE_URL = 'http://localhost:8080/api'; 

const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const { token, username, role } = response.data;
  
    console.log('Login response:', response.data);
  
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ username, role }));
  
    return { username, role } as User;
  },
 
register: async (userData: { username: string; password: string; role: string }) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData);
  const { token, username, role } = response.data;

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ username, role }));
  localStorage.setItem('role', role);

  return { username, role } as User;
},

getCurrentUser: (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);

    if (!user.username || !user.role) return null;
    return user;
  } catch (err) {
    console.error('Error parsing user from localStorage:', err);
    return null;
  }
},

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;
