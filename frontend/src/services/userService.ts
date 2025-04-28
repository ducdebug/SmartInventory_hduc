import apiClient from '../utils/apiClient';
import authService from './authService';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  enabled: boolean;
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  deleted?: boolean;
  authorities?: Array<{ authority: string }>;
  img_url?: string;
}

const userService = {
  /**
   * Get the current user's profile information
   */
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  /**
   * Change the current user's password
   */
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    try {
      await apiClient.post('/auth/change-password', data);
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  /**
   * Update the user's profile image
   */
  updateProfileImage: async (file: File): Promise<{ message: string; img_url: string }> => {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      // Override default content-type to make sure the browser sets the correct boundary for multipart/form-data
      const response = await apiClient.post('/api/user/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update the user object in localStorage with the new image URL
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.img_url = response.data.img_url;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile image:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile image');
    }
  }
};

export default userService;
