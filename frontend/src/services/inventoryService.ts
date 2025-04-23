import axios from 'axios';
import { API_BASE_URL } from '../config';
import { SlotInfo, ShelfInfo , ProductType, StorageStrategy} from '../types/inventory'; // điều chỉnh path nếu cần

const inventoryService = {
  getSectionInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouse/sections/info`);
      console.log("Fetched sections:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching section info:', error);
      throw error;
    }
  },

  getSectionChildren: async (sectionId: string): Promise<SlotInfo[] | ShelfInfo[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/section/${sectionId}/children`);
      return response.data;
    } catch (error) {
      console.error('Error fetching section children:', error);
      throw error;
    }
  },
  getSlotsByShelf: async (shelfId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/shelf/shelves/${shelfId}/slots`);
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
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/inventory/batch`, batchData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error storing batch:', error);
      throw error;
    }
  },
  getLotHistory: async () => {
    const res = await axios.get(`${API_BASE_URL}/lot/history`);
    console.log('Lot history:', res.data);
    return res.data;
  },  
  
  getPendingLots: async () => {
    const res = await axios.get(`${API_BASE_URL}/lot/pending`);
    console.log('Pending lots:', res.data);
    return res.data;
  },
  
  getAcceptedLots: async () => {
    const res = await axios.get(`${API_BASE_URL}/lot/accepted`);
    console.log('Accepted lots:', res.data);
    return res.data;
  },
  
  acceptLot: async (lotId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/lot/${lotId}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      console.error('Error accepting lot:', error);
      throw error;
    }
  },
  
  getLotDetails: async (lotId: string) => {
    const res = await axios.get(`${API_BASE_URL}/lot/${lotId}`);
    return res.data;
  },

  getProductBySlot: async (slotId: string) => {
    const res = await axios.get(`${API_BASE_URL}/inventory/${slotId}/product`);
    console.log('Product by slot:', res.data);
    return res.data;
  },
  getAllProducts: async () => {
    const res = await axios.get(`${API_BASE_URL}/inventory/retrieveAll`);
    console.log('All products:', res.data);
    return res.data;
  },
  exportProducts: async (payload: {
    products: {
      quantity: number;
      name: string;
      detail: Record<string, any>;
    }[];
  }) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Exporting products:', payload);
      const res = await axios.post(`${API_BASE_URL}/inventory/export`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
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
      const token = localStorage.getItem('token');
      console.log('Creating retrieve request:', payload);
      const res = await axios.post(`${API_BASE_URL}/inventory/retrieve-request`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
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
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/inventory/section`,
        data,
        {
          headers: {
            'Content-Type': 'application/json', // 💥 BẮT BUỘC
            Authorization: `Bearer ${token}`,
          },
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
      const response = await axios.get(`${API_BASE_URL}/inventory/product-type-distribution`);
      console.log("Product type distribution:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching product type distribution:', error);
      throw error;
    }
  },
  
  getInventoryAnalytics: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/analytics`);
      console.log("Inventory analytics:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }
};

export default inventoryService;