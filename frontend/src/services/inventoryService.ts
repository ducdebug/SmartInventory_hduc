import apiClient from '../utils/apiClient';
import { SlotInfo, ShelfInfo, ProductType, StorageStrategy } from '../types/inventory';

const inventoryService = {
  getSectionInfo: async () => {
    try {
      const response = await apiClient.get('/warehouse/sections/info');
      return response.data;
    } catch (error) {
      console.error('Error fetching section info:', error);
      throw error;
    }
  },

  getSectionChildren: async (sectionId: string): Promise<SlotInfo[] | ShelfInfo[]> => {
    try {
      const response = await apiClient.get(`/section/${sectionId}/children`);
      return response.data;
    } catch (error) {
      console.error('Error fetching section children:', error);
      throw error;
    }
  },
  
  getSlotsByShelf: async (shelfId: string) => {
    try {
      const response = await apiClient.get(`/shelf/shelves/${shelfId}/slots`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shelf slots:', error);
      throw error;
    }
  },
  
  storeBatch: async (batchData: {
    productType: ProductType;
    storageStrategy: StorageStrategy;
    productDetails: Record<string, any>[];
  }) => {
    try {
      const response = await apiClient.post('/inventory/batch', batchData);
      return response.data;
    } catch (error) {
      console.error('Error storing batch:', error);
      throw error;
    }
  },
  
  getLotHistory: async () => {
    try {
      const response = await apiClient.get('/lot/history');
      console.log('Lot history:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching lot history:', error);
      throw error;
    }
  },  
  
  getPendingLots: async () => {
    try {
      const response = await apiClient.get('/lot/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending lots:', error);
      throw error;
    }
  },
  
  getAcceptedLots: async () => {
    try {
      const response = await apiClient.get('/lot/accepted');
      return response.data;
    } catch (error) {
      console.error('Error fetching accepted lots:', error);
      throw error;
    }
  },
  
  acceptLot: async (lotId: string) => {
    try {
      const response = await apiClient.post(`/lot/${lotId}/accept`, {});
      return response.data;
    } catch (error) {
      console.error('Error accepting lot:', error);
      throw error;
    }
  },
  
  getLotDetails: async (lotId: string) => {
    try {
      const response = await apiClient.get(`/lot/${lotId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lot details:', error);
      throw error;
    }
  },

  getProductBySlot: async (slotId: string) => {
    try {
      const response = await apiClient.get(`/inventory/${slotId}/product`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product by slot:', error);
      throw error;
    }
  },
  
  getAllProducts: async () => {
    try {
      const response = await apiClient.get('/inventory/retrieveAll');
      console.log('All products:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  },
  
  exportProducts: async (payload: {
    products: {
      quantity: number;
      name: string;
      detail: Record<string, any>;
    }[];
  }) => {
    try {
      const response = await apiClient.post('/inventory/export', payload);
      return response.data;
    } catch (error) {
      console.error('Error exporting products:', error);
      throw error;
    }
  },
  
  createRetrieveRequest: async (payload: {
    products: {
      quantity: number;
      name: string;
      detail: Record<string, any>;
    }[];
  }) => {
    try {
      const response = await apiClient.post('/inventory/retrieve-request', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating retrieve request:', error);
      throw error;
    }
  },
  
  createSection: async (data: {
    name: string;
    y_slot: number;
    shelf_height?: number;
    storageConditions: {
      conditionType: string;
      minValue?: number;
      maxValue?: number;
      unit?: string;
    }[];
  }) => {
    try {
      const response = await apiClient.post(
        '/inventory/section',
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  },

  getProductTypeDistribution: async () => {
    try {
      const response = await apiClient.get('/inventory/product-type-distribution');
      return response.data;
    } catch (error) {
      console.error('Error fetching product type distribution:', error);
      throw error;
    }
  },
  
  getInventoryAnalytics: async () => {
    try {
      const response = await apiClient.get('/inventory/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }
};

export default inventoryService;