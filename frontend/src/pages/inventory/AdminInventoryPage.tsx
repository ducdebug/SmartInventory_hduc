import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Tabs, 
  Card, 
  Typography, 
  Table, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Button, 
  DatePicker, 
  Row, 
  Col, 
  Statistic, 
  Tooltip, 
  Badge,
  Spin,
  message,
  Collapse,
  Divider,
  Empty,
  Alert
} from 'antd';
import { 
  DollarOutlined, 
  AreaChartOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ExportOutlined, 
  InboxOutlined, 
  EnvironmentOutlined,
  BarcodeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClearOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import inventoryService from '../../services/inventoryService';
import AdvancedAnalyticsPage from './AdvancedAnalyticsPage';
import type { ColumnsType } from 'antd/es/table';
import type { ChangeEvent } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface EnhancedProduct {
  productId: string;
  productName: string;
  productType: string;
  lotId: string;
  lotCode: string;
  importDate: string;
  importedByUser: string;
  dispatchId: string | null;
  dispatchStatus: 'IN_WAREHOUSE' | 'EXPORTED';
  dispatchDate: string | null;
  buyerUsername: string | null;
  buyerId: string | null;
  sectionId: string | null;
  sectionName: string | null;
  shelfId: string | null;
  slotId: string | null;
  locationPath: string;
  expirationDate: string | null;
  onShelf: boolean;
  details: Record<string, any>;
}

interface LotWithProducts {
  lotId: string;
  lotCode: string;
  importDate: string;
  importedByUser: string;
  status: string;
  products: EnhancedProduct[];
}

interface FilterState {
  dispatchStatus: string;
  sectionName: string;
  productType: string;
  lotCode: string;
  productName: string;
  supplierUsername: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
}

interface StatsData {
  totalProducts: number;
  inWarehouse: number;
  exported: number;
  totalLots: number;
  uniqueLocations: number;
  expiringItems: number;
}

const EnhancedInventoryTab: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<LotWithProducts[]>([]);
  const [filteredData, setFilteredData] = useState<LotWithProducts[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    dispatchStatus: '',
    sectionName: '',
    productType: '',
    lotCode: '',
    productName: '',
    supplierUsername: '',
    dateRange: null
  });
  
  // Enhanced statistics
  const [stats, setStats] = useState<StatsData>({
    totalProducts: 0,
    inWarehouse: 0,
    exported: 0,
    totalLots: 0,
    uniqueLocations: 0,
    expiringItems: 0
  });

  // Debounce filter application for better performance
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchEnhancedData();
  }, []);

  // Debounced filter application
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms debounce
    
    setDebounceTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [filters]);

  const fetchEnhancedData = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getEnhancedProductsByLotForAdmin();
      const processedData = processLotData(response || []);
      setData(processedData);
      setFilteredData(processedData);
      calculateStats(processedData);
    } catch (error) {
      console.error('Error fetching enhanced inventory data:', error);
      message.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const processLotData = (backendData: any[]): LotWithProducts[] => {
    return backendData.map(lot => ({
      lotId: lot.lotId,
      lotCode: lot.lotCode,
      importDate: lot.importDate,
      importedByUser: lot.importedByUser,
      status: lot.status,
      products: lot.products.map((product: any) => ({
        productId: product.productId,
        productName: product.productName,
        productType: product.productType,
        lotId: lot.lotId,
        lotCode: lot.lotCode,
        importDate: lot.importDate,
        importedByUser: lot.importedByUser,
        dispatchId: product.dispatchId,
        dispatchStatus: product.dispatchStatus,
        dispatchDate: product.dispatchDate,
        buyerUsername: product.buyerUsername,
        buyerId: product.buyerId,
        sectionId: product.sectionId,
        sectionName: product.sectionName,
        shelfId: product.shelfId,
        slotId: product.slotId,
        locationPath: product.locationPath || 'Location Pending',
        expirationDate: product.expirationDate,
        onShelf: product.onShelf,
        details: product.details || {}
      }))
    }));
  };

  const calculateStats = (lotData: LotWithProducts[]) => {
    const allProducts = lotData.flatMap(lot => lot.products);
    const uniqueLocations = new Set(
      allProducts
        .filter(p => p.locationPath && p.locationPath !== 'Location Pending')
        .map(p => p.sectionName)
    ).size;
    
    const expiringItems = allProducts.filter(p => {
      if (!p.expirationDate) return false;
      const expirationDate = dayjs(p.expirationDate);
      const daysUntilExpiry = expirationDate.diff(dayjs(), 'days');
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length;

    setStats({
      totalProducts: allProducts.length,
      inWarehouse: allProducts.filter(p => p.dispatchStatus === 'IN_WAREHOUSE').length,
      exported: allProducts.filter(p => p.dispatchStatus === 'EXPORTED').length,
      totalLots: lotData.length,
      uniqueLocations,
      expiringItems
    });
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      
      const filterParams: any = {};
      
      if (filters.dispatchStatus) filterParams.dispatchStatus = filters.dispatchStatus;
      if (filters.sectionName) filterParams.sectionName = filters.sectionName;
      if (filters.productType) filterParams.productType = filters.productType;
      if (filters.lotCode) filterParams.lotCode = filters.lotCode;
      if (filters.productName) filterParams.productName = filters.productName;
      if (filters.supplierUsername) filterParams.supplierUsername = filters.supplierUsername;
      
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        filterParams.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        filterParams.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await inventoryService.getEnhancedProductsByLotForAdmin(filterParams);
      const processedData = processLotData(response || []);
      setFilteredData(processedData);
      calculateStats(processedData);
    } catch (error) {
      console.error('Error applying filters:', error);
      message.error('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      dispatchStatus: '',
      sectionName: '',
      productType: '',
      lotCode: '',
      productName: '',
      supplierUsername: '',
      dateRange: null
    });
  }, []);

  const getStatusTag = (status: string) => {
    return status === 'EXPORTED' ? (
      <Tag color="red" icon={<ExportOutlined />}>Exported</Tag>
    ) : (
      <Tag color="green" icon={<InboxOutlined />}>In Warehouse</Tag>
    );
  };

  const getLocationDisplay = (product: EnhancedProduct) => {
    if (!product.locationPath || product.locationPath === 'Location Pending') {
      return <Tag color="orange">Location Pending</Tag>;
    }
    return (
      <Tooltip title={`Full path: ${product.locationPath}`}>
        <Tag color="blue" icon={<EnvironmentOutlined />}>
          {product.locationPath.length > 25 ? 
            `${product.locationPath.substring(0, 25)}...` : 
            product.locationPath
          }
        </Tag>
      </Tooltip>
    );
  };

  const getExpirationStatus = (product: EnhancedProduct) => {
    if (!product.expirationDate) return null;
    
    const expirationDate = dayjs(product.expirationDate);
    const daysUntilExpiry = expirationDate.diff(dayjs(), 'days');
    
    if (daysUntilExpiry < 0) {
      return <Tag color="red">Expired</Tag>;
    } else if (daysUntilExpiry <= 7) {
      return <Tag color="orange">Expires in {daysUntilExpiry} days</Tag>;
    } else if (daysUntilExpiry <= 30) {
      return <Tag color="yellow">Expires in {daysUntilExpiry} days</Tag>;
    }
    return null;
  };

  const columns: ColumnsType<EnhancedProduct> = [
    {
      title: 'Product Info',
      key: 'productInfo',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.productName}</Text>
          <Tag color="blue">{record.productType}</Tag>
          <Text type="secondary" code>{record.productId}</Text>
          {getExpirationStatus(record)}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => getStatusTag(record.dispatchStatus),
      filters: [
        { text: 'In Warehouse', value: 'IN_WAREHOUSE' },
        { text: 'Exported', value: 'EXPORTED' },
      ],
      onFilter: (value, record) => record.dispatchStatus === value,
    },
    {
      title: 'Location',
      key: 'location',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {getLocationDisplay(record)}
          {record.onShelf && <Tag size="small" color="cyan">On Shelf</Tag>}
          {record.sectionName && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Section: {record.sectionName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Lot Information',
      key: 'lotInfo',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color="purple" icon={<BarcodeOutlined />}>{record.lotCode}</Tag>
          <Text type="secondary">
            <CalendarOutlined /> {dayjs(record.importDate).format('MMM DD, YYYY')}
          </Text>
          <Text type="secondary">
            <UserOutlined /> {record.importedByUser}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Dispatch Info',
      key: 'dispatchInfo',
      width: 200,
      render: (_, record) => {
        if (record.dispatchStatus === 'EXPORTED') {
          return (
            <Space direction="vertical" size="small">
              <Text type="secondary" code>{record.dispatchId}</Text>
              <Text type="secondary">
                <UserOutlined /> {record.importedByUser || 'Unknown'}
              </Text>
              <Text type="secondary">
                <CalendarOutlined /> {record.dispatchDate ? dayjs(record.dispatchDate).format('MMM DD, YYYY') : 'N/A'}
              </Text>
            </Space>
          );
        }
        return <Text type="secondary">Not dispatched</Text>;
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 120,
      render: (_, record) => (
        <Tooltip
          title={
            <div>
              {Object.entries(record.details || {}).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {String(value || 'N/A')}
                </div>
              ))}
              {record.expirationDate && (
                <div>
                  <strong>Expiration:</strong> {dayjs(record.expirationDate).format('MMM DD, YYYY')}
                </div>
              )}
              <div>
                <strong>Slot ID:</strong> {record.slotId || 'Not assigned'}
              </div>
            </div>
          }
        >
          <Button type="dashed" size="small">View Details</Button>
        </Tooltip>
      ),
    },
  ];

  const allProducts = useMemo(() => filteredData.flatMap(lot => lot.products), [filteredData]);

  const getRowClassName = (record: EnhancedProduct): string => {
    if (record.expirationDate) {
      const daysUntilExpiry = dayjs(record.expirationDate).diff(dayjs(), 'days');
      if (daysUntilExpiry < 0) return 'expired-row';
      if (daysUntilExpiry <= 7) return 'expiring-soon-row';
    }
    return '';
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Enhanced Header with Statistics */}
      <Card style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={4}>
            <Statistic 
              title="Total Products" 
              value={stats.totalProducts}
              prefix={<BarcodeOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="In Warehouse" 
              value={stats.inWarehouse}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Exported" 
              value={stats.exported}
              prefix={<ExportOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Total Lots" 
              value={stats.totalLots}
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Locations" 
              value={stats.uniqueLocations}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Expiring Soon" 
              value={stats.expiringItems}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
        
        {stats.expiringItems > 0 && (
          <Alert
            style={{ marginTop: '16px' }}
            message={`Warning: ${stats.expiringItems} items will expire within 30 days`}
            type="warning"
            showIcon
            closable
          />
        )}
      </Card>

      {/* Enhanced Filters */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            Advanced Filters
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ClearOutlined />} 
              onClick={clearAllFilters}
              type="default"
            >
              Clear All
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchEnhancedData}
              type="primary"
            >
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: '20px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              value={filters.dispatchStatus}
              onChange={(value: string) => handleFilterChange('dispatchStatus', value)}
              allowClear
            >
              <Option value="IN_WAREHOUSE">In Warehouse</Option>
              <Option value="EXPORTED">Exported</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Section"
              prefix={<EnvironmentOutlined />}
              value={filters.sectionName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('sectionName', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Product Type"
              prefix={<BarcodeOutlined />}
              value={filters.productType}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('productType', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Product Name"
              prefix={<SearchOutlined />}
              value={filters.productName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('productName', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Lot Code"
              prefix={<BarcodeOutlined />}
              value={filters.lotCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('lotCode', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Supplier"
              prefix={<UserOutlined />}
              value={filters.supplierUsername}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('supplierUsername', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={12}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              value={filters.dateRange}
              onChange={(dates: [Dayjs | null, Dayjs | null] | null) => handleFilterChange('dateRange', dates)}
              format="YYYY-MM-DD"
            />
          </Col>
        </Row>
      </Card>

      {/* Enhanced Product Table */}
      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Product Inventory
            </Title>
            <Badge count={allProducts.length} />
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', margin: '50px 0' }}>
            <Spin size="large" tip="Loading enhanced inventory data..." />
          </div>
        ) : allProducts.length === 0 ? (
          <Empty 
            description="No products found matching the current filters"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={allProducts}
            rowKey="productId"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number, range: [number, number]) => 
                `${range[0]}-${range[1]} of ${total} products`,
              pageSizeOptions: ['10', '20', '50', '100'],
              defaultPageSize: 20,
            }}
            scroll={{ x: 1300 }}
            size="middle"
            bordered
            rowClassName={getRowClassName}
          />
        )}
      </Card>

      {/* Lot-based View (Enhanced) */}
      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>Lot-based View</Title>
            <Badge count={filteredData.length} />
          </Space>
        }
        style={{ marginTop: '20px' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredData.length === 0 ? (
          <Empty description="No lots found matching the current filters" />
        ) : (
          <Collapse accordion>
            {filteredData.map((lot) => (
              <Panel 
                header={
                  <Space>
                    <Tag color="purple">{lot.lotCode}</Tag>
                    <Text>Imported: {dayjs(lot.importDate).format('MMM DD, YYYY')}</Text>
                    <Text>By: {lot.importedByUser}</Text>
                    <Badge count={lot.products.length} />
                    <Tag color={lot.status === 'ACCEPTED' ? 'green' : 'orange'}>
                      {lot.status}
                    </Tag>
                  </Space>
                } 
                key={lot.lotId}
              >
                <Table
                  columns={columns}
                  dataSource={lot.products}
                  rowKey="productId"
                  pagination={false}
                  size="small"
                  rowClassName={getRowClassName}
                />
              </Panel>
            ))}
          </Collapse>
        )}
      </Card>

      {/* CSS Styles */}
      <style>{`
        .expired-row {
          background-color: #fff2f0 !important;
        }
        .expiring-soon-row {
          background-color: #fffbe6 !important;
        }
      `}</style>
    </div>
  );
};

const AdminInventoryPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return (
      <Card>
        <Text type="danger">You do not have permission to access this page</Text>
      </Card>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ marginBottom: '20px' }}>
        <Title level={3}>Inventory Administration</Title>
        <Text>Comprehensive inventory management with advanced tracking and filtering</Text>
      </Card>

      <Tabs 
        defaultActiveKey="enhanced" 
        type="card"
        items={[
          {
            key: 'enhanced',
            label: <span><SearchOutlined /> Inventory</span>,
            children: <EnhancedInventoryTab />,
          },
          {
            key: 'analytics',
            label: <span><AreaChartOutlined /> Advanced Analytics</span>,
            children: <AdvancedAnalyticsPage />,
          },
        ]}
      />
    </div>
  );
};

export default AdminInventoryPage;