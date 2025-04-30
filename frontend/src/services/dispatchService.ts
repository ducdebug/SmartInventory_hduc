import apiClient from '../utils/apiClient';
import { handleAxiosError } from '../utils/errorHandler';

export interface DispatchProduct {
  id?: string;
  name?: string;
  quantity?: number;
  lotCode?: string;
  expirationDate?: string;
}

export interface DispatchItem {
  id: string;
  productId: string;
  quantity: number;
  product?: DispatchProduct;
}

export interface Dispatch {
  id: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  items?: DispatchItem[];
  totalItems?: number;
}

const dispatchService = {
  getBuyerDispatches: async (): Promise<Dispatch[]> => {
    try {
      const response = await apiClient.get('/api/dispatches/buyer');

      return response.data.map((item: any) => ({
        ...item,
        status: item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
      }));
    } catch (error) {
      console.error('Error in getBuyerDispatches:', error);
      throw handleAxiosError(error, 'Failed to fetch dispatch history');
    }
  },

  getDispatchDetails: async (dispatchId: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.get(`/api/dispatches/${dispatchId}`);
      let processedData = {...response.data};
            if (processedData.items && Array.isArray(processedData.items)) {
                processedData.items = processedData.items.map((item: any) => {
          const productIdShort = item.productId ? item.productId.substring(0, 8) : 'unknown';
                    if (!item.product) {
            console.warn(`Item ${item.id} is missing product data, creating placeholder`);
            return {
              ...item,
              product: {
                id: item.productId || 'unknown',
                name: `Product #${productIdShort}`,
                lotCode: `LOT-${productIdShort}`,
                expirationDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
              }
            };
          } else {
            const enhancedProduct = {
              ...item.product,
              lotCode: item.product.lotCode || `LOT-${productIdShort}`,
              expirationDate: item.product.expirationDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
            };
            
            return {
              ...item,
              product: enhancedProduct
            };
          }
        });
        
      }
      
      return {
        ...processedData,
        status: processedData.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
      };
    } catch (error) {
      throw handleAxiosError(error, 'Failed to fetch dispatch details');
    }
  },

  getPendingDispatches: async (): Promise<Dispatch[]> => {
    try {
      const response = await apiClient.get('/api/dispatches/admin/pending');

      return response.data.map((item: any) => ({
        ...item,
        status: item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
      }));
    } catch (error) {
      console.error('Error in getPendingDispatches:', error);
      throw handleAxiosError(error, 'Failed to fetch pending dispatches');
    }
  },

  getCompletedDispatches: async (): Promise<Dispatch[]> => {
    try {
      const response = await apiClient.get('/api/dispatches/admin/accepted-rejected');
      return response.data.map((item: any) => ({
        ...item,
        status: item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
      }));
    } catch (error) {
      console.error('Error in getCompletedDispatches:', error);
      throw handleAxiosError(error, 'Failed to fetch completed dispatches');
    }
  },

  acceptDispatch: async (dispatchId: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.post(`/api/dispatches/${dispatchId}/accept`);
      return {
        ...response.data,
        status: response.data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
      };
    } catch (error) {
      console.error('Error in acceptDispatch:', error);
      throw handleAxiosError(error, 'Failed to accept dispatch');
    }
  },

  rejectDispatch: async (dispatchId: string, reason: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.post(`/api/dispatches/${dispatchId}/reject`, { reason });
      return {
        ...response.data,
        status: response.data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
      };
    } catch (error) {
      console.error('Error in rejectDispatch:', error);
      throw handleAxiosError(error, 'Failed to reject dispatch');
    }
  },

  completeDispatch: async (dispatchId: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.post(`/api/dispatches/${dispatchId}/complete`);
      return {
        ...response.data,
        status: response.data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
      };
    } catch (error) {
      console.error('Error in completeDispatch:', error);
      throw handleAxiosError(error, 'Failed to complete dispatch');
    }
  }
};

export default dispatchService;