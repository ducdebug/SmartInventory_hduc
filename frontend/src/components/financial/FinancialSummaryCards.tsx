import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Alert, Avatar, Typography, List } from 'antd';
import { UserOutlined, CrownOutlined, TrophyOutlined, StarOutlined, DollarOutlined } from '@ant-design/icons';
import inventoryService from '../../services/inventoryService';
import './FinancialSummaryCards.css';

const { Title, Text } = Typography;

interface TopSupplier {
  supplierId: string;
  supplierName: string;
  totalIncome: number;
  productsSold: number;
}

const FinancialSummaryCards: React.FC = () => {
  const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopSuppliers = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getTopSuppliers(10);
        setTopSuppliers(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching top suppliers:', err);
        setError('Failed to load top suppliers data');
      } finally {
        setLoading(false);
      }
    };

    fetchTopSuppliers();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B VND`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VND`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K VND`;
    }
    return `${amount.toFixed(0)} VND`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <CrownOutlined style={{ color: '#ffd700', fontSize: '18px' }} />;
      case 1:
        return <TrophyOutlined style={{ color: '#c0c0c0', fontSize: '16px' }} />;
      case 2:
        return <StarOutlined style={{ color: '#cd7f32', fontSize: '16px' }} />;
      default:
        return <span style={{ 
          fontWeight: 'bold', 
          color: '#666',
          fontSize: '14px',
          minWidth: '20px',
          textAlign: 'center',
          display: 'inline-block'
        }}>#{index + 1}</span>;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return '#ffd700';
      case 1:
        return '#c0c0c0';
      case 2:
        return '#cd7f32';
      default:
        return '#1677ff';
    }
  };

  if (loading) {
    return (
      <div className="financial-summary-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading top suppliers"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  if (!topSuppliers || topSuppliers.length === 0) {
    return (
      <Alert
        message="No suppliers data available"
        description="No revenue data found for suppliers"
        type="info"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  // Split suppliers into top 3 and rest
  const topThree = topSuppliers.slice(0, 3);
  const restSuppliers = topSuppliers.slice(3);

  return (
    <div className="financial-summary-cards">
      <Title level={3} style={{ marginBottom: '24px', textAlign: 'center' }}>
        <DollarOutlined /> Top 10 Suppliers by Revenue
      </Title>
      
      {/* Top 3 Suppliers - Special Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {topThree.map((supplier, index) => (
          <Col xs={24} sm={12} lg={8} key={supplier.supplierId}>
            <Card 
              className={`financial-summary-card top-supplier-card rank-${index + 1}`}
              style={{ 
                borderColor: getRankColor(index),
                boxShadow: `0 4px 12px ${getRankColor(index)}20`,
                textAlign: 'center'
              }}
            >
              <div className="supplier-card-content">
                <div className="supplier-rank" style={{ marginBottom: '12px' }}>
                  {getRankIcon(index)}
                </div>
                <Avatar 
                  size={64} 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: getRankColor(index),
                    marginBottom: '12px'
                  }}
                />
                <Title level={4} style={{ margin: '8px 0', color: getRankColor(index) }}>
                  {supplier.supplierName}
                </Title>
                <div className="supplier-stats">
                  <Text strong style={{ color: getRankColor(index), fontSize: '18px' }}>
                    {formatCompactCurrency(supplier.totalIncome)}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {supplier.productsSold} products sold
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Rest of Suppliers - Compact Cards */}
      {restSuppliers.length > 0 && (
        <Row gutter={[16, 16]}>
          {restSuppliers.map((supplier, index) => (
            <Col xs={24} sm={12} lg={6} key={supplier.supplierId}>
              <Card 
                className="financial-summary-card supplier-card-compact"
                size="small"
                style={{ textAlign: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {getRankIcon(index + 3)}
                  <Avatar size={32} icon={<UserOutlined />} />
                  <Text strong style={{ fontSize: '14px' }}>
                    {supplier.supplierName}
                  </Text>
                </div>
                <div>
                  <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>
                    {formatCompactCurrency(supplier.totalIncome)}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {supplier.productsSold} products
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default FinancialSummaryCards;