import axios from 'axios';

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  enabled: boolean;
  img_url?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const getImageDisplayUrl = (url?: string): string => {
  if (!url) return '';
  
  if (url.startsWith('data:')) {
    return url;
  }
  
  const base64Patterns = ['/9j/', 'iVBOR', 'PHN2', 'R0lGOD', 'PD94'];
  if (base64Patterns.some(pattern => url.startsWith(pattern))) {
    return `data:image/jpeg;base64,${url}`;
  }
  
  if (/^[A-Za-z0-9+/=]+$/.test(url)) {
    return `data:image/jpeg;base64,${url}`;
  }
  
  return url;
};

const userService = {

  getProfile: async (): Promise<UserProfile> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Make direct API call to get profile
      const response = await axios.get('http://localhost:8080/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch profile:', error.response || error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch user profile');
    }
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      await axios.post('http://localhost:8081/auth/change-password', data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error: any) {
      console.error('Password change error:', error.response || error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to change password');
    }
  },

  updateProfileImage: async (image: File): Promise<{img_url: string}> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('profileImage', image);

      const response = await fetch('http://localhost:8080/api/user/profile/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const updatedUser = JSON.parse(userStr);
          if (updatedUser) {
            updatedUser.img_url = data.img_url;
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Error updating user in localStorage:', error);
        }
      }
      
      return { img_url: data.img_url };
    } catch (error: any) {
      console.error('Profile image update error:', error);
      throw new Error(error.message || 'Failed to update profile image');
    }
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.put('http://localhost:8081/auth/profile', data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update profile:', error.response || error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update profile');
    }
  }
};

export default userService;