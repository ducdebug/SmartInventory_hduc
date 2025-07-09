import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Spin,
  message,
  DatePicker,
  Select,
  Space,
  Button,
  Tabs,
  Tag,
  Progress,
  Alert,
  Empty,
  Tooltip,
  Badge,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  UserOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  TrendingUpOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import advancedAnalyticsService, { 
  AdvancedAnalyticsResponse,
  SupplierSpendData,
  SupplierSectionSpendData,
  MonthlyRevenueData,
  SectionProfitabilityData,
  SummaryMetrics
} from '../../services/advancedAnalyticsService';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdvancedAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<AdvancedAnalyticsResponse | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      message.error('You do not have permission to access this page');
      return;
    }
    
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await advancedAnalyticsService.getAdvancedAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = async (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      try {
        setLoading(true);
        const startDate = dates[0].format('YYYY-MM-DD');
        const endDate = dates[1].format('YYYY-MM-DD');
        const monthlyData = await advancedAnalyticsService.getRevenueDataByDateRange(startDate, endDate);
        
        if (analyticsData) {
          setAnalyticsData({
            ...analyticsData,
            monthlyRevenue: monthlyData
          });
        }
      } catch (error) {
        console.error('Error fetching date range data:', error);
        message.error('Failed to load data for selected date range');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Card>
        <Text type="danger">You do not have permission to access this page</Text>
      </Card>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '50px 0' }}>
        <Spin size="large" tip="Loading advanced analytics..." />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <Empty description="No analytics data available" />
      </Card>
    );
  }

  const supplierColumns = [
    {
      title: 'Supplier',
      dataIndex: 'supplierUsername',
      key: 'supplierUsername',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a: SupplierSpendData, b: SupplierSpendData) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      render: (count: number) => <Badge count={count} showZero />,
    },
    {
      title: 'Avg per Product',
      dataIndex: 'averageSpendPerProduct',
      key: 'averageSpendPerProduct',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Active Lots',
      dataIndex: 'activeLots',
      key: 'activeLots',
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Top Sections',
      dataIndex: 'topSections',
      key: 'topSections',
      render: (sections: string[]) => (
        <div>
          {sections.slice(0, 3).map((section, index) => (
            <Tag key={index} color="purple" style={{ marginBottom: 4 }}>
              {section}
            </Tag>
          ))}
          {sections.length > 3 && (
            <Tooltip title={sections.slice(3).join(', ')}>
              <Tag color="default">+{sections.length - 3} more</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const sectionProfitabilityColumns = [
    {
      title: 'Section',
      dataIndex: 'sectionName',
      key: 'sectionName',
      render: (text: string, record: SectionProfitabilityData) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Tag color="cyan">{record.storageCondition}</Tag>
        </Space>
      ),
    },
    {
      title: 'Supplier Revenue',
      dataIndex: 'supplierRevenue',
      key: 'supplierRevenue',
      render: (amount: number) => formatCurrency(amount),
      sorter: (a: SectionProfitabilityData, b: SectionProfitabilityData) => a.supplierRevenue - b.supplierRevenue,
    },
    {
      title: 'Maintenance Fee',
      dataIndex: 'monthlyMaintenanceFee',
      key: 'monthlyMaintenanceFee',
      render: (amount: number) => (
        <Text type="secondary">{formatCurrency(amount)}</Text>
      ),
    },
    {
      title: 'Net Profit',
      dataIndex: 'netProfit',
      key: 'netProfit',
      render: (profit: number) => (
        <Text style={{ color: profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(profit)}
        </Text>
      ),
      sorter: (a: SectionProfitabilityData, b: SectionProfitabilityData) => a.netProfit - b.netProfit,
    },
    {
      title: 'Utilization',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      render: (rate: number) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate > 80 ? 'exception' : rate > 60 ? 'active' : 'normal'}
        />
      ),
    },
    {
      title: 'Active Suppliers',
      dataIndex: 'activeSuppliers',
      key: 'activeSuppliers',
      render: (count: number) => <Badge count={count} showZero />,
    },
    {
      title: 'Products',
      dataIndex: 'totalProducts',
      key: 'totalProducts',
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
  ];

  const supplierSectionColumns = [
    {
      title: 'Supplier',
      dataIndex: 'supplierUsername',
      key: 'supplierUsername',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Section',
      dataIndex: 'sectionName',
      key: 'sectionName',
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => formatCurrency(amount),
      sorter: (a: SupplierSectionSpendData, b: SupplierSectionSpendData) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      render: (count: number) => <Badge count={count} showZero />,
    },
    {
      title: 'Utilization',
      dataIndex: 'utilizationPercentage',
      key: 'utilizationPercentage',
      render: (percentage: number) => (
        <Progress 
          percent={percentage} 
          size="small"
          format={() => `${percentage.toFixed(1)}%`}
        />
      ),
    },
  ];

  const revenueColumns = [
    {
      title: 'Period',
      key: 'period',
      render: (record: MonthlyRevenueData) => (
        <Text strong>{record.month} {record.year}</Text>
      ),
    },
    {
      title: 'Supplier Spend',
      dataIndex: 'totalSupplierSpend',
      key: 'totalSupplierSpend',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Maintenance Fees',
      dataIndex: 'totalMaintenanceFees',
      key: 'totalMaintenanceFees',
      render: (amount: number) => (
        <Text type="secondary">{formatCurrency(amount)}</Text>
      ),
    },
    {
      title: 'Net Revenue',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      render: (amount: number) => (
        <Text style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Profit Margin',
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      render: (margin: number) => (
        <Text style={{ color: margin >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatPercentage(margin)}
        </Text>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'totalProducts',
      key: 'totalProducts',
      render: (count: number) => <Badge count={count} showZero />,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '20px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>
              <BarChartOutlined /> Advanced Analytics
            </Title>
            <Text>Comprehensive warehouse financial and operational analytics</Text>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder={['Start Date', 'End Date']}
              />
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchAnalyticsData}
                type="primary"
              >
                Refresh
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={() => message.info('Export functionality coming soon')}
              >
                Export PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Metrics */}
      <Card style={{ marginBottom: '20px' }}>
        <Title level={4}>Summary Metrics</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Total Revenue"
              value={analyticsData.summaryMetrics.totalWarehouseRevenue}
              prefix={<DollarOutlined />}
              formatter={(value: any) => formatCurrency(Number(value))}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Net Profit"
              value={analyticsData.summaryMetrics.netProfit}
              prefix={<RiseOutlined />}
              formatter={(value: any) => formatCurrency(Number(value))}
              valueStyle={{ 
                color: analyticsData.summaryMetrics.netProfit >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Profit Margin"
              value={analyticsData.summaryMetrics.profitMarginPercentage}
              suffix="%"
              precision={1}
              valueStyle={{ 
                color: analyticsData.summaryMetrics.profitMarginPercentage >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Revenue Growth"
              value={analyticsData.summaryMetrics.revenueGrowthRate}
              suffix="%"
              precision={1}
              prefix={<RiseOutlined />}
              valueStyle={{ 
                color: analyticsData.summaryMetrics.revenueGrowthRate >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Top Spending Supplier"
              value={analyticsData.summaryMetrics.topSpendingSupplier}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Most Profitable Section"
              value={analyticsData.summaryMetrics.mostProfitableSection}
              prefix={<AppstoreOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Avg Revenue per Supplier"
              value={analyticsData.summaryMetrics.averageRevenuePerSupplier}
              formatter={(value: any) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Total Exported Products"
              value={analyticsData.summaryMetrics.totalExportedProducts}
            />
          </Col>
        </Row>
      </Card>

      {/* Warehouse Profitability Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} lg={12}>
          <Card title="Warehouse Profitability Overview">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Total Revenue (12 months)"
                  value={analyticsData.warehouseProfitability.totalRevenue}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Costs"
                  value={analyticsData.warehouseProfitability.totalCosts}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Net Profit"
                  value={analyticsData.warehouseProfitability.netProfit}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  valueStyle={{ 
                    color: analyticsData.warehouseProfitability.netProfit >= 0 ? '#52c41a' : '#f5222d' 
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Profit Margin"
                  value={analyticsData.warehouseProfitability.profitMargin}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    color: analyticsData.warehouseProfitability.profitMargin >= 0 ? '#52c41a' : '#f5222d' 
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Operational Metrics">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Active Suppliers"
                  value={analyticsData.warehouseProfitability.totalActiveSuppliers}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Active Sections"
                  value={analyticsData.warehouseProfitability.totalActiveSections}
                  prefix={<AppstoreOutlined />}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Average Monthly Revenue"
                  value={analyticsData.warehouseProfitability.averageMonthlyRevenue}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  prefix={<DollarOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Detailed Analytics Tabs */}
      <Tabs 
        defaultActiveKey="supplier-spending"
        type="card"
        items={[
          {
            key: 'supplier-spending',
            label: (
              <span>
                <UserOutlined />
                Supplier Spending Analysis
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="Supplier Spending Analysis"
                  description="This table shows which suppliers spend the most on warehouse storage, helping identify your top revenue-generating clients."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <Table
                  columns={supplierColumns}
                  dataSource={analyticsData.supplierSpending}
                  rowKey="supplierUsername"
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total: number, range: [number, number]) => 
                      `${range[0]}-${range[1]} of ${total} suppliers`,
                  }}
                  scroll={{ x: 800 }}
                />
              </Card>
            ),
          },
          {
            key: 'section-profitability',
            label: (
              <span>
                <AppstoreOutlined />
                Section Profitability
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="Section Profitability Analysis"
                  description="Analyze which warehouse sections generate the most profit by comparing supplier revenue against maintenance costs."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <Table
                  columns={sectionProfitabilityColumns}
                  dataSource={analyticsData.sectionProfitability}
                  rowKey="sectionId"
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total: number, range: [number, number]) => 
                      `${range[0]}-${range[1]} of ${total} sections`,
                  }}
                  scroll={{ x: 1000 }}
                />
              </Card>
            ),
          },
          {
            key: 'supplier-section-spending',
            label: (
              <span>
                <PieChartOutlined />
                Supplier-Section Breakdown
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="Supplier Section Spending"
                  description="Detailed breakdown of how much each supplier spends in each warehouse section."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <Table
                  columns={supplierSectionColumns}
                  dataSource={analyticsData.supplierSectionSpending}
                  rowKey={(record: SupplierSectionSpendData) => `${record.supplierUsername}-${record.sectionName}`}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total: number, range: [number, number]) => 
                      `${range[0]}-${range[1]} of ${total} entries`,
                  }}
                  scroll={{ x: 800 }}
                />
              </Card>
            ),
          },
          {
            key: 'monthly-revenue',
            label: (
              <span>
                <LineChartOutlined />
                Monthly Revenue Trends
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="Monthly Revenue Analysis"
                  description="Track warehouse revenue trends over time, including supplier spending, maintenance costs, and net profit margins."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <Table
                  columns={revenueColumns}
                  dataSource={analyticsData.monthlyRevenue}
                  rowKey={(record: MonthlyRevenueData) => `${record.month}-${record.year}`}
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Help Section */}
      <Card style={{ marginTop: '20px' }}>
        <Alert
          message="Understanding Advanced Analytics"
          description={
            <div>
              <p><strong>Supplier Spending:</strong> Shows how much each supplier pays for warehouse storage based on section usage and storage time.</p>
              <p><strong>Section Profitability:</strong> Compares revenue from suppliers using each section against the maintenance costs of that section.</p>
              <p><strong>Net Revenue:</strong> Total supplier payments minus total maintenance costs for the warehouse.</p>
              <p><strong>Utilization Rate:</strong> Percentage of section capacity being used by products.</p>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsPage;