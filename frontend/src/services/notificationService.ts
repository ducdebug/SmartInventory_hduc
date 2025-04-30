import apiClient from '../utils/apiClient';

export interface Notification {
  id: number;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

const notificationService = {

  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get('/api/notifications/user');
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch notifications');
    }
  },

  getUnreadNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get('/api/notifications/user/unread');
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch unread notifications');
    }
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to mark notification as read');
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put('/api/notifications/read-all');
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to mark all notifications as read');
    }
  }
};

export default notificationService;