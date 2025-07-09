import apiClient from '../utils/apiClient';

export interface SupplierSpendData {
  supplierUsername: string;
  supplierId: string;
  totalSpent: number;
  productCount: number;
  averageSpendPerProduct: number;
  topSections: string[];
  activeLots: number;
}

export interface SupplierSectionSpendData {
  supplierUsername: string;
  sectionName: string;
  totalSpent: number;
  productCount: number;
  monthlyMaintenanceFee: number;
  utilizationPercentage: number;
}

export interface MonthlyRevenueData {
  month: string;
  year: number;
  totalSupplierSpend: number;
  totalMaintenanceFees: number;
  netRevenue: number;
  profitMargin: number;
  totalProducts: number;
  spendBySection: Record<string, number>;
}

export interface WarehouseProfitabilityData {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  averageMonthlyRevenue: number;
  totalActiveSuppliers: number;
  totalActiveSections: number;
}

export interface SectionProfitabilityData {
  sectionName: string;
  sectionId: string;
  monthlyMaintenanceFee: number;
  supplierRevenue: number;
  netProfit: number;
  utilizationRate: number;
  activeSuppliers: number;
  totalProducts: number;
  storageCondition: string;
}

export interface SummaryMetrics {
  totalWarehouseRevenue: number;
  totalMaintenanceCosts: number;
  netProfit: number;
  profitMarginPercentage: number;
  topSpendingSupplier: string;
  mostProfitableSection: string;
  averageRevenuePerSupplier: number;
  totalExportedProducts: number;
  revenueGrowthRate: number;
}

export interface AdvancedAnalyticsResponse {
  supplierSpending: SupplierSpendData[];
  supplierSectionSpending: SupplierSectionSpendData[];
  monthlyRevenue: MonthlyRevenueData[];
  warehouseProfitability: WarehouseProfitabilityData;
  sectionProfitability: SectionProfitabilityData[];
  summaryMetrics: SummaryMetrics;
}

class AdvancedAnalyticsService {
  private baseURL = 'http://localhost:8080/api/section/analytics';

  async getAdvancedAnalytics(): Promise<AdvancedAnalyticsResponse> {
    const response = await apiClient.get(this.baseURL);
    return response.data;
  }

  async getSupplierSpendingAnalysis(): Promise<SupplierSpendData[]> {
    const response = await apiClient.get(`${this.baseURL}/supplier-spending`);
    return response.data;
  }

  async getSupplierSectionSpending(): Promise<SupplierSectionSpendData[]> {
    const response = await apiClient.get(`${this.baseURL}/supplier-section-spending`);
    return response.data;
  }

  async getMonthlyRevenueData(months: number = 12): Promise<MonthlyRevenueData[]> {
    const response = await apiClient.get(`${this.baseURL}/monthly-revenue`, {
      params: { months }
    });
    return response.data;
  }

  async getWarehouseProfitability(): Promise<WarehouseProfitabilityData> {
    const response = await apiClient.get(`${this.baseURL}/warehouse-profitability`);
    return response.data;
  }

  async getSectionProfitabilityAnalysis(): Promise<SectionProfitabilityData[]> {
    const response = await apiClient.get(`${this.baseURL}/section-profitability`);
    return response.data;
  }

  async getSummaryMetrics(): Promise<SummaryMetrics> {
    const response = await apiClient.get(`${this.baseURL}/summary-metrics`);
    return response.data;
  }

  async getRevenueDataByDateRange(startDate: string, endDate: string): Promise<MonthlyRevenueData[]> {
    const response = await apiClient.get(`${this.baseURL}/revenue-by-date-range`, {
      params: { startDate, endDate }
    });
    return response.data;
  }
}

export default new AdvancedAnalyticsService();