import apiClient from '../utils/apiClient';
import authApiClient from '../utils/authApiClient';
import { handleAxiosError } from '../utils/errorHandler';

export interface DispatchProduct {
  id?: string;
  name?: string;
  quantity?: number;
  lotCode?: string;
  expirationDate?: string;
  primaryPrice?: {
    value: number;
    currency: string;
  };
  secondaryPrice?: {
    value: number;
    currency: string;
  };
  unitPrice?: {
    value: number;
    currency: string;
  };
  baseProduct?: {
    id?: string;
    secondaryPrice?: {
      value: number;
      currency: string;
    };
  };
}

export interface DispatchItem {
  id: string;
  productId: string;
  quantity: number;
  product?: DispatchProduct;
  subtotal?: {
    value: number;
    currency: string;
  };
}

export interface Dispatch {
  id: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  items?: DispatchItem[];
  totalItems?: number;
  totalPrice?: {
    value: number;
    currency: string;
  };
}

const dispatchService = {
  getBuyerDispatches: async (): Promise<Dispatch[]> => {
    try {
      const response = await apiClient.get('/api/dispatches/buyer');
      console.log('Raw buyer dispatches from API:', response.data);

      return response.data.map((item: any) => {
        let dispatch = {
          ...item,
          status: item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED'
        };
        
        if (!dispatch.totalPrice || dispatch.totalPrice.value === 0) {
          let totalValue = 0;
          let currency = 'VND';
          
          if (dispatch.items && Array.isArray(dispatch.items)) {
            dispatch.items.forEach((dispatchItem: any) => {
              if (dispatchItem.subtotal) {
                totalValue += dispatchItem.subtotal.value;
                currency = dispatchItem.subtotal.currency;
              }
              else if (dispatchItem.product) {
                let price = null;
                
                if (dispatchItem.product.unitPrice) {
                  price = dispatchItem.product.unitPrice;
                } else if (dispatchItem.product.baseProduct && dispatchItem.product.baseProduct.secondaryPrice) {
                  price = dispatchItem.product.baseProduct.secondaryPrice;
                } else if (dispatchItem.product.secondaryPrice) {
                  price = dispatchItem.product.secondaryPrice;
                } else if (dispatchItem.product.primaryPrice) {
                  price = dispatchItem.product.primaryPrice;
                }
                
                if (price) {
                  totalValue += price.value * dispatchItem.quantity;
                  currency = price.currency;
                }
              }
            });
          }
          
          dispatch.totalPrice = {
            value: parseFloat(totalValue.toFixed(2)),
            currency: currency
          };
        }
        
        return dispatch;
      });
    } catch (error) {
      console.error('Error in getBuyerDispatches:', error);
      throw handleAxiosError(error, 'Failed to fetch dispatch history');
    }
  },

  getDispatchDetails: async (dispatchId: string): Promise<Dispatch> => {
    try {
      const response = await apiClient.get(`/api/dispatches/${dispatchId}`);
      console.log('Raw dispatch data from API:', response.data);
      let processedData = {...response.data};

      
      if (processedData.items && Array.isArray(processedData.items)) {
        processedData.items = processedData.items.map((item: any) => {
          const productIdShort = item.productId ? item.productId.substring(0, 8) : 'unknown';
                    const originalSubtotal = item.subtotal;
          
          if (!item.product) {
            console.warn(`Item ${item.id} is missing product data, creating placeholder`);
            const enhancedItem = {
              ...item,
              product: {
                id: item.productId || 'unknown',
                name: `Product #${productIdShort}`,
                lotCode: `LOT-${productIdShort}`,
                expirationDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
                primaryPrice: {
                  value: 0,
                  currency: 'VND'
                }
              }
            };
            
            if (originalSubtotal) {
              enhancedItem.subtotal = originalSubtotal;
                            if (enhancedItem.product && enhancedItem.quantity > 0) {
                enhancedItem.product.unitPrice = {
                  value: originalSubtotal.value / enhancedItem.quantity,
                  currency: originalSubtotal.currency
                };
              }
            }
            
            return enhancedItem;
          } else {
            const enhancedProduct = {
              ...item.product,
              lotCode: item.product.lotCode || `LOT-${productIdShort}`,
              expirationDate: item.product.expirationDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
            };
            
            if (!enhancedProduct.unitPrice) {
              let productPrice = null;
              
              if (item.product.baseProduct && item.product.baseProduct.secondaryPrice) {
                productPrice = item.product.baseProduct.secondaryPrice;
              }
              else if (enhancedProduct.secondaryPrice && enhancedProduct.secondaryPrice.value) {
                productPrice = enhancedProduct.secondaryPrice;
              }
              else if (enhancedProduct.primaryPrice && enhancedProduct.primaryPrice.value) {
                productPrice = enhancedProduct.primaryPrice;
              }
                            if (productPrice) {
                enhancedProduct.unitPrice = productPrice;
              } else {
                console.warn(`No price found for product ${enhancedProduct.name}`);
                
                enhancedProduct.unitPrice = {
                  value: 0,
                  currency: 'VND'
                };
              }
            }
            
            const enhancedItem = {
              ...item,
              product: enhancedProduct
            };
            
            if (originalSubtotal) {
              enhancedItem.subtotal = originalSubtotal;
            } 
            else if (enhancedProduct.unitPrice) {
              enhancedItem.subtotal = {
                value: parseFloat((enhancedProduct.unitPrice.value * item.quantity).toFixed(2)),
                currency: enhancedProduct.unitPrice.currency
              };
            }
            
            return enhancedItem;
          }
        });
      }
      
      if (!processedData.totalPrice) {
        let calculatedTotal = 0;
        let currency = 'VND';
        
        if (processedData.items && Array.isArray(processedData.items)) {
          processedData.items.forEach((item: any) => {
            if (item.subtotal) {
              calculatedTotal += item.subtotal.value;
              currency = item.subtotal.currency;
            }
          });
        }
        
        processedData.totalPrice = {
          value: parseFloat(calculatedTotal.toFixed(2)),
          currency: currency
        };
      }
      
      if (!processedData.totalItems && processedData.items) {
        processedData.totalItems = processedData.items.length;
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
  },

  // Temporary User Management Functions
  createTemporaryUser: async (userData: CreateTemporaryUserRequest): Promise<TemporaryUserResponse> => {
    try {
      // Use authApiClient for auth service endpoints
      const response = await authApiClient.post('/api/temporary-users/create', userData);
      return response.data;
    } catch (error) {
      console.error('Error in createTemporaryUser:', error);
      throw handleAxiosError(error, 'Failed to create temporary user');
    }
  },

  getTemporaryUsers: async (): Promise<TemporaryUser[]> => {
    try {
      const response = await authApiClient.get('/api/temporary-users');
      return response.data;
    } catch (error) {
      console.error('Error in getTemporaryUsers:', error);
      throw handleAxiosError(error, 'Failed to fetch temporary users');
    }
  }
};

// Types for temporary user management
export interface CreateTemporaryUserRequest {
  username: string;
  name: string;
  email: string;
  company: string;
  temporarypassword: string;
}

export interface TemporaryUserResponse {
  id: string;
  username: string;
  name: string;
  email: string;
  company: string;
  temporaryPassword: string;
  supplierId: string;
  enabled: boolean;
}

export interface TemporaryUser {
  id: string;
  username: string;
  name: string;
  email: string;
  company: string;
  role: string;
  enabled: boolean;
  deleted: boolean;
  tmpPassword?: string;
}

export default dispatchService;