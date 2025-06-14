import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, List, Typography, Spin, Alert } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, UserOutlined, RiseOutlined } from '@ant-design/icons';
import inventoryService from '../../services/inventoryService';
import './FinancialWidgets.css';

const { Title, Text } = Typography;

interface FinancialData {
  supplierIncomeData: {
    totalIncome: number;
    monthlyIncome: number;
    totalProductsSold: number;
    monthlyProductsSold: number;
    averageOrderValue: number;
    topSuppliers: Array<{
      supplierName: string;
      supplierId: string;
      totalIncome: number;
      productsSold: number;
    }>;
  };
  buyerSpendingData: {
    totalSpending: number;
    monthlySpending: number;
    totalOrdersPlaced: number;
    monthlyOrdersPlaced: number;
    averageOrderValue: number;
    topBuyers: Array<{
      buyerName: string;
      buyerId: string;
      totalSpending: number;
      ordersPlaced: number;
    }>;
  };
  financialSummary: {
    totalRevenue: number;
    totalCommissions: number;
    netProfit: number;
    growthRate: number;
  };
}

const FinancialWidgets: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getFinancialAnalytics();
        setFinancialData(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching financial analytics:', err);
        setError('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <div className="financial-widgets-loading">
        <Spin size="large" />
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  if (!financialData) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="financial-widgets">
      <Title level={3} style={{ marginBottom: '24px' }}>
        Financial Analytics
      </Title>

      {/* Main Financial Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="financial-card">
            <Statistic
              title="Total Revenue"
              value={financialData.financialSummary.totalRevenue}
              formatter={(value: any) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="financial-card">
            <Statistic
              title="Monthly Growth"
              value={financialData.financialSummary.growthRate}
              formatter={(value: any) => formatPercentage(Number(value))}
              prefix={<RiseOutlined />}
              valueStyle={{ 
                color: financialData.financialSummary.growthRate >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="financial-card">
            <Statistic
              title="Total Commissions"
              value={financialData.financialSummary.totalCommissions}
              formatter={(value: any) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="financial-card">
            <Statistic
              title="Net Profit"
              value={financialData.financialSummary.netProfit}
              formatter={(value: any) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Supplier Income and Buyer Spending Widgets */}
      <Row gutter={[24, 24]}>
        {/* Supplier Income Widget */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="widget-title">
                <DollarOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                Supplier Income Analytics
              </div>
            }
            className="financial-widget-card"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Income"
                  value={financialData.supplierIncomeData.totalIncome}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Monthly Income"
                  value={financialData.supplierIncomeData.monthlyIncome}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                />
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Statistic
                  title="Products Sold"
                  value={financialData.supplierIncomeData.totalProductsSold}
                  suffix="total"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Monthly Sales"
                  value={financialData.supplierIncomeData.monthlyProductsSold}
                  suffix="products"
                />
              </Col>
            </Row>

            <div style={{ marginTop: '20px' }}>
              <Title level={5}>Top Suppliers</Title>
              <List
                size="small"
                dataSource={financialData.supplierIncomeData.topSuppliers}
                renderItem={(supplier: any, index: number) => (
                  <List.Item>
                    <div className="supplier-item">
                      <div className="supplier-rank">#{index + 1}</div>
                      <div className="supplier-info">
                        <Text strong>{supplier.supplierName}</Text>
                        <br />
                        <Text type="secondary">
                          {formatCurrency(supplier.totalIncome)} • {supplier.productsSold} products
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* Buyer Spending Widget */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="widget-title">
                <ShoppingCartOutlined style={{ color: '#1677ff', marginRight: '8px' }} />
                Buyer Spending Analytics
              </div>
            }
            className="financial-widget-card"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Spending"
                  value={financialData.buyerSpendingData.totalSpending}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Monthly Spending"
                  value={financialData.buyerSpendingData.monthlySpending}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                />
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Statistic
                  title="Total Orders"
                  value={financialData.buyerSpendingData.totalOrdersPlaced}
                  suffix="orders"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Monthly Orders"
                  value={financialData.buyerSpendingData.monthlyOrdersPlaced}
                  suffix="orders"
                />
              </Col>
            </Row>

            <div style={{ marginTop: '20px' }}>
              <Title level={5}>Top Buyers</Title>
              <List
                size="small"
                dataSource={financialData.buyerSpendingData.topBuyers}
                renderItem={(buyer: any, index: number) => (
                  <List.Item>
                    <div className="buyer-item">
                      <div className="buyer-rank">#{index + 1}</div>
                      <div className="buyer-info">
                        <Text strong>{buyer.buyerName}</Text>
                        <br />
                        <Text type="secondary">
                          {formatCurrency(buyer.totalSpending)} • {buyer.ordersPlaced} orders
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinancialWidgets;