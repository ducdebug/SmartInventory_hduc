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
  }
};

export default dispatchService;