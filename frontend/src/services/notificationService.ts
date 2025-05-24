import { NOTIFICATION_API_BASE_URL } from '../config';
import { getAuthToken } from './authService';

export interface Notification {
  id: number;
  userId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  relatedId?: string;
  imgUrl?: string;
  title?: string;
}

export interface NotificationCounts {
  total: number;
  unread: number;
}

const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },

  getUnreadNotifications: async (): Promise<Notification[]> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/api/notifications/unread`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  },

  markAllAsRead: async (): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/api/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  },

  getNotificationCounts: async (): Promise<NotificationCounts> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/api/notifications/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }
};

export default notificationService;
