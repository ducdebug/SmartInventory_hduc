import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Typography, Table, Tooltip, Spin, Alert, Progress } from 'antd';
import { 
  DollarCircleOutlined, 
  TrophyOutlined, 
  CalendarOutlined, 
  TeamOutlined,
  ShopOutlined,
  BarChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import inventoryService from '../../services/inventoryService';
import './RevenueWidget.css';

const { Title, Text } = Typography;

interface WarehouseRevenueData {
  totalRevenue: number; // Net profit (Revenue - Costs)
  totalStorageFees: number; // Revenue from storage fees charged to suppliers
  totalMaintenanceCosts: number; // Costs from section maintenance fees
  currency: string;
  calculatedAt: string;
  sectionDetails: SectionRevenueDetail[];
  userRevenues: UserRevenueDetail[];
  breakdown: RevenueBreakdown;
}

interface SectionRevenueDetail {
  sectionId: string;
  sectionName: string;
  activatedSince: string;
  monthlyMaintenanceFee: number; // This is a COST
  totalStorageFeesGenerated: number; // Revenue from storage fees charged to suppliers
  netProfit: number; // Revenue - Costs for this section
  monthsActive: number;
  totalProducts: number;
  topUserIds: string[];
}

interface UserRevenueDetail {
  userId: string;
  username: string;
  userRole: string;
  totalStorageFeesCharged: number; // Fees charged to this supplier
  totalLots: number;
  totalProducts: number;
  firstLotDate: string;
  lastLotDate: string;
}

interface RevenueBreakdown {
  totalStorageFees: number; // Revenue from storage fees charged to suppliers
  totalMaintenanceCosts: number; // Costs from section maintenance fees
  specialConditionSurcharges: number; // Additional revenue
  totalActiveSections: number;
  totalActiveProducts: number;
  totalUsers: number;
  profitMargin: number; // (Revenue - Costs) / Revenue * 100
}

const RevenueWidget: React.FC = () => {
  const [revenueData, setRevenueData] = useState<WarehouseRevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const rawData = await inventoryService.getWarehouseRevenue();
      
      // Transform old data structure to new structure
      const transformedData = transformRevenueData(rawData);
      setRevenueData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  // Transform old data structure to new profit-based structure
  const transformRevenueData = (rawData: any): WarehouseRevenueData => {
    console.log('Raw data from backend:', rawData);
    console.log('Section details:', rawData.sectionDetails);
    console.log('User revenues:', rawData.userRevenues);

    // Calculate total storage fees (revenue) from section details
    const totalStorageFees = rawData.sectionDetails?.reduce((sum: number, section: any) => {
      const storageRevenue = section.totalRevenueGenerated || section.totalStorageFeesGenerated || 0;
      console.log(`Section ${section.sectionName}: revenue = ${storageRevenue}`);
      return sum + storageRevenue;
    }, 0) || 0;

    // Calculate total from user fees for comparison
    const totalUserFees = rawData.userRevenues?.reduce((sum: number, user: any) => {
      const userFees = user.totalSpent || user.totalStorageFeesCharged || 0;
      console.log(`User ${user.username}: fees = ${userFees}`);
      return sum + userFees;
    }, 0) || 0;

    console.log(`Total Storage Fees from sections: ${totalStorageFees}`);
    console.log(`Total User Fees from users: ${totalUserFees}`);
    console.log(`Discrepancy: ${totalStorageFees - totalUserFees}`);

    // Calculate total maintenance costs from section details
    const totalMaintenanceCosts = rawData.sectionDetails?.reduce((sum: number, section: any) => {
      const monthlyCost = section.monthlyMaintenanceFee || 0;
      const monthsActive = section.monthsActive || 1;
      return sum + (monthlyCost * monthsActive);
    }, 0) || 0;

    // Net profit = Revenue - Costs
    const netProfit = totalStorageFees - totalMaintenanceCosts;

    // Calculate profit margin
    const profitMargin = totalStorageFees > 0 ? (netProfit / totalStorageFees) * 100 : 0;

    // Transform section details
    const transformedSectionDetails = rawData.sectionDetails?.map((section: any) => ({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      activatedSince: section.activatedSince,
      monthlyMaintenanceFee: section.monthlyMaintenanceFee || 0,
      totalStorageFeesGenerated: section.totalRevenueGenerated || section.totalStorageFeesGenerated || 0,
      netProfit: (section.totalRevenueGenerated || section.totalStorageFeesGenerated || 0) - 
                 ((section.monthlyMaintenanceFee || 0) * (section.monthsActive || 1)),
      monthsActive: section.monthsActive || 1,
      totalProducts: section.totalProducts || 0,
      topUserIds: section.topUserIds || []
    })) || [];

    // Transform user details
    const transformedUserRevenues = rawData.userRevenues?.map((user: any) => ({
      userId: user.userId,
      username: user.username,
      userRole: user.userRole,
      totalStorageFeesCharged: user.totalSpent || user.totalStorageFeesCharged || 0,
      totalLots: user.totalLots || 0,
      totalProducts: user.totalProducts || 0,
      firstLotDate: user.firstLotDate,
      lastLotDate: user.lastLotDate
    })) || [];

    return {
      totalRevenue: netProfit, // Net profit (Revenue - Costs)
      totalStorageFees: totalStorageFees, // Revenue from storage fees
      totalMaintenanceCosts: totalMaintenanceCosts, // Costs from maintenance
      currency: rawData.currency || 'USD',
      calculatedAt: rawData.calculatedAt || new Date().toISOString(),
      sectionDetails: transformedSectionDetails,
      userRevenues: transformedUserRevenues,
      breakdown: {
        totalStorageFees: totalStorageFees,
        totalMaintenanceCosts: totalMaintenanceCosts,
        specialConditionSurcharges: rawData.breakdown?.specialConditionSurcharges || 0,
        totalActiveSections: rawData.breakdown?.totalActiveSections || transformedSectionDetails.length,
        totalActiveProducts: rawData.breakdown?.totalActiveProducts || 0,
        totalUsers: rawData.breakdown?.totalUsers || transformedUserRevenues.length,
        profitMargin: profitMargin
      }
    };
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    // Handle NaN, null, undefined values
    if (isNaN(amount) || amount === null || amount === undefined) {
      amount = 0;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const sectionColumns = [
    {
      title: 'Section',
      dataIndex: 'sectionName',
      key: 'sectionName',
      render: (name: string, record: SectionRevenueDetail) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Active since {formatTimeAgo(record.activatedSince)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Monthly Cost',
      dataIndex: 'monthlyMaintenanceFee',
      key: 'monthlyMaintenanceFee',
      render: (fee: number, record: SectionRevenueDetail) => (
        <div>
          <Text strong style={{ color: '#ff4d4f' }}>
            -{formatCurrency(fee, revenueData?.currency)}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.monthsActive} months active
          </Text>
        </div>
      ),
      sorter: (a: SectionRevenueDetail, b: SectionRevenueDetail) => a.monthlyMaintenanceFee - b.monthlyMaintenanceFee,
    },
    {
      title: 'Storage Revenue',
      dataIndex: 'totalStorageFeesGenerated',
      key: 'totalStorageFeesGenerated',
      render: (revenue: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(revenue, revenueData?.currency)}
        </Text>
      ),
      sorter: (a: SectionRevenueDetail, b: SectionRevenueDetail) => a.totalStorageFeesGenerated - b.totalStorageFeesGenerated,
    },
    {
      title: 'Net Profit',
      dataIndex: 'netProfit',
      key: 'netProfit',
      render: (profit: number) => (
        <Text strong style={{ color: profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(profit, revenueData?.currency)}
        </Text>
      ),
      sorter: (a: SectionRevenueDetail, b: SectionRevenueDetail) => a.netProfit - b.netProfit,
    },
    {
      title: 'Products',
      dataIndex: 'totalProducts',
      key: 'totalProducts',
      render: (count: number) => (
        <Tooltip title={`${count} products stored in this section`}>
          <Text>{count}</Text>
        </Tooltip>
      ),
      sorter: (a: SectionRevenueDetail, b: SectionRevenueDetail) => a.totalProducts - b.totalProducts,
    },
  ];

  const userColumns = [
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (name: string, record: UserRevenueDetail) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.userRole}
          </Text>
        </div>
      ),
    },
    {
      title: 'Storage Fees Charged',
      dataIndex: 'totalStorageFeesCharged',
      key: 'totalStorageFeesCharged',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(amount, revenueData?.currency)}
        </Text>
      ),
      sorter: (a: UserRevenueDetail, b: UserRevenueDetail) => a.totalStorageFeesCharged - b.totalStorageFeesCharged,
    },
    {
      title: 'Activity',
      key: 'activity',
      render: (record: UserRevenueDetail) => (
        <div>
          <Text>{record.totalLots} lots</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.totalProducts} products
          </Text>
        </div>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (record: UserRevenueDetail) => (
        <div>
          {record.firstLotDate && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatTimeAgo(record.firstLotDate)} to{' '}
              {record.lastLotDate ? formatTimeAgo(record.lastLotDate) : 'now'}
            </Text>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Card className="revenue-widget">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>Loading revenue data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="revenue-widget">
        <Alert
          message="Revenue Data Unavailable"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!revenueData) {
    return null;
  }

  const topSections = revenueData.sectionDetails
    .filter(section => section && typeof section.netProfit === 'number')
    .sort((a, b) => (b.netProfit || 0) - (a.netProfit || 0))
    .slice(0, 5);

  const topUsers = revenueData.userRevenues
    .filter(user => user && typeof user.totalStorageFeesCharged === 'number')
    .sort((a, b) => (b.totalStorageFeesCharged || 0) - (a.totalStorageFeesCharged || 0))
    .slice(0, 5);

  return (
    <div className="revenue-widget">
      {/* Total Revenue Header */}
      <Card className="revenue-header-card">
        <div className="revenue-header">
          <div className="revenue-main">
            <div className="revenue-icon">
              <DollarCircleOutlined />
            </div>
            <div className="revenue-content">
              <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                {formatCurrency(revenueData.totalRevenue, revenueData.currency)}
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Net Profit (Revenue - Costs)
              </Text>
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                <Text style={{ color: '#1890ff' }}>
                  Revenue: {formatCurrency(revenueData.totalStorageFees || 0, revenueData.currency)}
                </Text>
                <Text style={{ color: '#ff4d4f', marginLeft: '16px' }}>
                  Costs: {formatCurrency(revenueData.totalMaintenanceCosts || 0, revenueData.currency)}
                </Text>
              </div>
            </div>
          </div>
          <div className="revenue-stats">
            <Statistic
              title="Active Sections"
              value={revenueData.breakdown.totalActiveSections}
              prefix={<ShopOutlined />}
              valueStyle={{ fontSize: '24px' }}
            />
            <Statistic
              title="Total Users"
              value={revenueData.breakdown.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: '24px' }}
            />
            <Statistic
              title="Products Stored"
              value={revenueData.breakdown.totalActiveProducts}
              prefix={<BarChartOutlined />}
              valueStyle={{ fontSize: '24px' }}
            />
          </div>
        </div>
      </Card>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        {/* Section Revenue Breakdown */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <ShopOutlined style={{ marginRight: '8px' }} />
                Section Profit Analysis
              </span>
            }
            extra={
              <Tooltip title={`Updated ${formatTimeAgo(revenueData.calculatedAt)}`}>
                <CalendarOutlined />
              </Tooltip>
            }
          >
            <Table
              dataSource={topSections}
              columns={sectionColumns}
              pagination={false}
              size="small"
              rowKey="sectionId"
              className="revenue-table"
            />
            {revenueData.sectionDetails.length > 5 && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '12px', display: 'block' }}>
                Showing top 5 of {revenueData.sectionDetails.length} sections
              </Text>
            )}
          </Card>
        </Col>

        {/* Top Spending Users */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <TrophyOutlined style={{ marginRight: '8px' }} />
                Top Revenue Generating Suppliers
              </span>
            }
          >
            <Table
              dataSource={topUsers}
              columns={userColumns}
              pagination={false}
              size="small"
              rowKey="userId"
              className="revenue-table"
            />
            {revenueData.userRevenues.length > 5 && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '12px', display: 'block' }}>
                Showing top 5 of {revenueData.userRevenues.length} users
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Revenue Progress Indicators */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Profit Margin"
              value={revenueData.breakdown.profitMargin || 0}
              precision={1}
              prefix={<RiseOutlined />}
              suffix="%"
              valueStyle={{ color: (revenueData.breakdown.profitMargin || 0) >= 0 ? '#3f8600' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Average Revenue per User"
              value={revenueData.breakdown.totalUsers > 0 
                ? (revenueData.totalStorageFees || 0) / revenueData.breakdown.totalUsers 
                : 0}
              precision={2}
              prefix={<TeamOutlined />}
              suffix={revenueData.currency}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Profit per Product"
              value={revenueData.breakdown.totalActiveProducts > 0 
                ? revenueData.totalRevenue / revenueData.breakdown.totalActiveProducts 
                : 0}
              precision={2}
              prefix={<BarChartOutlined />}
              suffix={revenueData.currency}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RevenueWidget;