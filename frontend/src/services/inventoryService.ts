import apiClient from '../utils/apiClient';
import { SlotInfo, ShelfInfo, ProductType, StorageStrategy } from '../types/inventory';

interface PriceCalculationRequest {
  slotCount: number;
  storageConditions: string[];
}

interface PriceCalculationResponse {
  basePrice: number;
  finalPrice: number;
  multiplier: number;
  currency: string;
  slotCount: number;
  breakdown: string;
}

const inventoryService = {
  calculatePrice: async (request: PriceCalculationRequest): Promise<PriceCalculationResponse> => {
    try {
      const response = await apiClient.post('/api/price/calculate', request);
      return response.data;
    } catch (error) {
      console.error('Price calculation error:', error);
      throw error;
    }
  },

  getSectionInfo: async () => {
    try {
      const response = await apiClient.get('/warehouse/sections/info');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getSectionChildren: async (sectionId: string): Promise<SlotInfo[] | ShelfInfo[]> => {
    try {
      const response = await apiClient.get(`/section/${sectionId}/children`);
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getSlotsByShelf: async (shelfId: string) => {
    try {
      const response = await apiClient.get(`/shelf/shelves/${shelfId}/slots`);
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  storeBatch: async (batchData: {
    productType: ProductType;
    storageStrategy: StorageStrategy;
    storageConditions: Record<string, any>[];
    productDetails: Record<string, any>[];
  }) => {
    try {
      const response = await apiClient.post('/inventory/batch', batchData);
      return response.data;
    } catch (error: any) {

      if (error.response) {

      }
      throw error;
    }
  },

  getLotHistory: async () => {
    try {
      const response = await apiClient.get('/lot/history');

      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getPendingLots: async () => {
    try {
      const response = await apiClient.get('/lot/pending');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getAcceptedLots: async () => {
    try {
      const response = await apiClient.get('/lot/accepted');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  acceptLot: async (lotId: string) => {
    try {
      const response = await apiClient.post(`/lot/${lotId}/accept`, {});
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getLotDetails: async (lotId: string) => {
    try {
      const response = await apiClient.get(`/lot/${lotId}`);
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  withdrawLot: async (lotId: string) => {
    try {
      const response = await apiClient.post(`/lot/${lotId}/withdraw`, {});
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  acceptWithdrawal: async (lotId: string) => {
    try {
      const response = await apiClient.post(`/lot/${lotId}/accept-withdrawal`, {});
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  rejectWithdrawal: async (lotId: string) => {
    try {
      const response = await apiClient.post(`/lot/${lotId}/reject-withdrawal`, {});
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getAllLots: async () => {
    try {
      const response = await apiClient.get('/lot/all');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getProductBySlot: async (slotId: string) => {
    try {
      const response = await apiClient.get(`/inventory/${slotId}/product`);
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getAllProducts: async () => {
    try {
      const response = await apiClient.get('/inventory/retrieveAll');

      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getProductsByLot: async () => {
    try {
      const response = await apiClient.get('/inventory/admin/products');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getProductsByLotForSupplier: async () => {
    try {
      const response = await apiClient.get('/inventory/supplier/products');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  updateSecondaryPrices: async (data: { 
    productPrices: Array<{
      productId: string;
      price: number;
      currency: string;
    }>,
    bulkPrice?: number,
    currency?: string,
    bulkMarkupPercentage?: number
  }) => {
    try {
      const response = await apiClient.post('/inventory/admin/products/prices', data);
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  updateSecondaryPricesAsSupplier: async (data: { 
    productPrices: Array<{
      productId: string;
      price: number;
      currency: string;
    }>,
    bulkPrice?: number,
    currency?: string,
    bulkMarkupPercentage?: number
  }) => {
    try {
      const response = await apiClient.post('/inventory/supplier/products/prices', data);
      return response.data;
    } catch (error) {

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

      throw error;
    }
  },

  createSection: async (data: {
    name: string;
    y_slot: number;
    shelf_height?: number;
    calculatedPrice: number;
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

      throw error;
    }
  },

  getProductTypeDistribution: async () => {
    try {
      const response = await apiClient.get('/inventory/product-type-distribution');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getInventoryAnalytics: async () => {
    try {
      const response = await apiClient.get('/inventory/analytics');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getFinancialAnalytics: async () => {
    try {
      const response = await apiClient.get('/inventory/financial-analytics');
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getTopSuppliers: async (limit: number = 10) => {
    try {
      const response = await apiClient.get(`/inventory/top-suppliers?limit=${limit}`);
      return response.data;
    } catch (error) {

      throw error;
    }
  },
  getTopBuyers: async (limit: number = 10) => {
    try {
      const response = await apiClient.get(`/inventory/top-buyers?limit=${limit}`);
      return response.data;
    } catch (error) {

      throw error;
    }
  }
};

export default inventoryService;