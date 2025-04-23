export enum StorageCondition {
  TEMPERATURE_CONTROLLED = 'TEMPERATURE_CONTROLLED',
  HUMIDITY_CONTROLLED = 'HIGH_HUMIDITY_CONTROLLED',
  HAZARDOUS_MATERIALS = 'HAZARDOUS_MATERIALS',
}

export interface SectionInfoResponse {
  id: string;
  name: string;
  x: number;
  y: number;
  numShelves: number;
  totalSlots: number;
  usedSlots: number;
  storageConditions: StorageConditionDto[];
}

export enum StorageConditions {
  TEMPERATURE_CONTROLLED = 'TEMPERATURE_CONTROLLED',
  HUMIDITY_CONTROLLED = 'HIGH_HUMIDITY_CONTROLLED',
  HAZARDOUS_MATERIALS = 'HAZARDOUS_MATERIALS',
}

export interface StorageConditionDto {
  conditionType: StorageConditions;
  minValue: number;
  maxValue: number;
  unit: string;
}

export interface SlotInfo {
  id: string;
  x: number;
  y: number;
  occupied: boolean;
}

export interface ShelfInfo {
  id: string;
  width: number;
  height: number;
  slotsPerShelf: number;
}

export enum StorageStrategy {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  FEFO = 'FEFO',
  NEAREST_LOCATION = 'NEAREST_LOCATION'
}

export enum ProductType {
  FOOD = 'FOOD',
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  RAW_MATERIAL = 'RAW_MATERIAL',
  PHARMACEUTICALS = 'PHARMACEUTICALS',
  COSMETICS = 'COSMETICS',
  BOOKS = 'BOOKS'
}

export interface BaseProductEntity {
  id: string;
  name: string;
  sku: string; 
  quantity: number;
  type: string;
  expirationDate?: string | null;
}
export interface ProductResponse {
  name: string;
  productType: string;
  detail: Record<string, any>;
}

export interface ProductRetrieveItem {
  productName: string;
  quantity: number;
  storageStrategy: StorageStrategy;
}

export interface SectionEntity {
  id: string;
  name: string;
  storageConditions: StorageCondition[];
  hasShelves: boolean;
  totalShelves?: number;
  totalSlots?: number;

  availableSlots: number;
  percentAvailable: number;
}

export interface Lot {
  id: string;
  importDate: string;
  storageStrategy: string;
  username: string;
  accepted: boolean;
  items: LotItem[];
}
export interface LotItem {
  productName: string;
  quantity: number;
  importDate: string;
  price: {
    value: number;
    currency: string;
  } | null;
}

