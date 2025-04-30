import authApiClient from '../utils/authApiClient';
import { UserRole } from '../types/auth';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  role?: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
  token: string;
  img_url?: string;
}

const tokenKey = 'authToken';
const userKey = 'user';
const userRoleKey = 'userRole';
const userIdKey = 'userId';

const authService = {
  login: async (data: LoginData): Promise<User> => {
    try {
      const response = await authApiClient.post('/login', data);
      const user = response.data;
      localStorage.setItem(tokenKey, user.token);
      localStorage.setItem(userKey, JSON.stringify(user));
      localStorage.setItem(userRoleKey, user.role);
      localStorage.setItem(userIdKey, user.id);
      
      return user;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed');
    }
  },

  register: async (data: RegisterData, profileImage?: File): Promise<User> => {
    try {
      let response;
      
      if (profileImage) {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);
        if (data.role) {
          formData.append('role', data.role);
        }
        formData.append('profileImage', profileImage);
        
        response = await authApiClient.post('/register-with-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await authApiClient.post('/register', data);
      }
      
      const user = response.data;
      localStorage.setItem(tokenKey, user.token);
      localStorage.setItem(userKey, JSON.stringify(user));
      localStorage.setItem(userRoleKey, user.role);
      localStorage.setItem(userIdKey, user.id);
      
      return user;
    } catch (error: any) {
      console.error('Registration error:', error.response || error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Registration failed');
    }
  },

  logout: (): void => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    localStorage.removeItem(userRoleKey);
    localStorage.removeItem(userIdKey);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(tokenKey);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(userKey);
    if (!userStr) {
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  getUserProfile: async (): Promise<any> => {
    try {
      const response = await authApiClient.get('/profile');
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch user profile');
    }
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(tokenKey);
};

export const getUserId = (): string | null => {
  return localStorage.getItem(userIdKey);
};

export const getUserRole = (): string | null => {
  return localStorage.getItem(userRoleKey);
};

export default authService;