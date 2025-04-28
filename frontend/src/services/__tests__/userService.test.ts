import userService from '../userService';
import apiClient from '../../utils/apiClient';
import { ChangePasswordData, UserProfile } from '../userService';

// Mock implementation
jest.mock('../../utils/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

// Mock the apiClient
jest.mock('../../utils/apiClient');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch profile data successfully', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        username: 'testuser',
        role: 'BUYER',
        enabled: true
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockProfile });

      const result = await userService.getProfile();
      
      expect(apiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockProfile);
    });

    it('should handle errors when fetching profile', async () => {
      const errorMessage = 'Failed to fetch profile';
      (apiClient.get as jest.Mock).mockRejectedValueOnce({ 
        response: { data: { message: errorMessage } } 
      });

      await expect(userService.getProfile()).rejects.toThrow(errorMessage);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData: ChangePasswordData = {
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({});

      await userService.changePassword(passwordData);
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', passwordData);
    });

    it('should handle errors when changing password', async () => {
      const errorMessage = 'Current password is incorrect';
      const passwordData: ChangePasswordData = {
        currentPassword: 'wrongpass',
        newPassword: 'newpass'
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce({ 
        response: { data: { message: errorMessage } } 
      });

      await expect(userService.changePassword(passwordData)).rejects.toThrow(errorMessage);
    });
  });
});
