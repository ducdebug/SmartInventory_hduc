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
  // Buyer-specific methods
  getBuyerDispatches: async (): Promise<Dispatch[]> => {
    try {
      console.log('Fetching buyer dispatches');
      const response = await apiClient.get('/api/dispatches/buyer');
      console.log('Response received:', response.data);
      
      // Transform API response to match our frontend model
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
      console.log('Dispatch details response:', response.data);
      
      let processedData = {...response.data};
      
      // Check if we have items with product data
      if (processedData.items && Array.isArray(processedData.items)) {
        console.log('Items before processing:', processedData.items);
        
        // Map over the items to ensure each has a valid product object with lot code and expiration
        processedData.items = processedData.items.map((item: any) => {
          // Create a product ID shortcode for displaying
          const productIdShort = item.productId ? item.productId.substring(0, 8) : 'unknown';
          
          // If the item doesn't have a product object or has incomplete data, enhance it
          if (!item.product) {
            console.warn(`Item ${item.id} is missing product data, creating placeholder`);
            return {
              ...item,
              product: {
                id: item.productId || 'unknown',
                name: `Product #${productIdShort}`,
                lotCode: `LOT-${productIdShort}`,
                expirationDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() // 30 days from now
              }
            };
          } else {
            // Item has a product object but might be missing lotCode or expirationDate
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
        
        console.log('Items after processing:', processedData.items);
      }
      
      return {
        ...processedData,
        status: processedData.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
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
      console.log('Accepted/Rejected dispatches:', response.data);

      // Transform API response to match our frontend model
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
      console.log('Dispatch accepted:', response.data);
      
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
      console.log('Dispatch rejected:', response.data);
      
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
      console.log('Dispatch accepted:', response.data);
      
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