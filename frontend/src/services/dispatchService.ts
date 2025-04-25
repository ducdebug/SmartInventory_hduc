import apiClient from '../utils/apiClient';
import { handleAxiosError } from '../utils/errorHandler';

export interface DispatchProduct {
  id: string;
  name: string;
  quantity: number;
  lotCode: string;
  expirationDate?: string;
}

export interface DispatchItem {
  id: string;
  productId: string;
  quantity: number;
  product: DispatchProduct;
}

export interface Dispatch {
  id: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  items: DispatchItem[];
  totalItems: number;
}

const dispatchService = {
  // Buyer-specific methods
  getBuyerDispatches: async (): Promise<Dispatch[]> => {
    try {
      console.log('Fetching buyer dispatches');
      const response = await apiClient.get('/api/dispatches/buyer');
      console.log('Response received:', response.data);
      
      // Transform API response to match our frontend model
      return response.data.map((item: any) => ({
        ...item,
        status: item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
      }));
    } catch (error) {
      console.error('Error in getBuyerDispatches:', error);
      throw handleAxiosError(error, 'Failed to fetch dispatch history');
    }
  },

  getDispatchDetails: async (dispatchId: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.get(`/api/dispatches/${dispatchId}`);
      
      // Transform API response to match our frontend model
      return {
        ...response.data,
        status: response.data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
      };
    } catch (error) {
      throw handleAxiosError(error, 'Failed to fetch dispatch details');
    }
  },

  // Admin-specific methods for dispatch management
  getPendingDispatches: async (): Promise<Dispatch[]> => {
    try {
      const response = await apiClient.get('/api/dispatches/admin/pending');
      console.log('Pending dispatches:', response.data);
      
      // Transform API response to match our frontend model
      return response.data.map((item: any) => ({
        ...item,
        status: item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
      }));
    } catch (error) {
      console.error('Error in getPendingDispatches:', error);
      throw handleAxiosError(error, 'Failed to fetch pending dispatches');
    }
  },

  getCompletedDispatches: async (): Promise<Dispatch[]> => {
    try {
      const response = await apiClient.get('/api/dispatches/admin/completed');
      console.log('Completed dispatches:', response.data);
      
      // Transform API response to match our frontend model
      return response.data.map((item: any) => ({
        ...item,
        status: item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
      }));
    } catch (error) {
      console.error('Error in getCompletedDispatches:', error);
      throw handleAxiosError(error, 'Failed to fetch completed dispatches');
    }
  },

  acceptDispatch: async (dispatchId: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.post(`/api/dispatches/${dispatchId}/accept`);
      console.log('Dispatch accepted:', response.data);
      
      return {
        ...response.data,
        status: response.data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
      };
    } catch (error) {
      console.error('Error in acceptDispatch:', error);
      throw handleAxiosError(error, 'Failed to accept dispatch');
    }
  },

  rejectDispatch: async (dispatchId: string, reason: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.post(`/api/dispatches/${dispatchId}/reject`, { reason });
      console.log('Dispatch rejected:', response.data);
      
      return {
        ...response.data,
        status: response.data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
      };
    } catch (error) {
      console.error('Error in rejectDispatch:', error);
      throw handleAxiosError(error, 'Failed to reject dispatch');
    }
  },

  completeDispatch: async (dispatchId: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.post(`/api/dispatches/${dispatchId}/complete`);
      console.log('Dispatch completed:', response.data);
      
      return {
        ...response.data,
        status: response.data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
      };
    } catch (error) {
      console.error('Error in completeDispatch:', error);
      throw handleAxiosError(error, 'Failed to complete dispatch');
    }
  }
};

export default dispatchService;