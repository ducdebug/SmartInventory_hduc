import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Alert, Avatar, Typography, List } from 'antd';
import { UserOutlined, CrownOutlined, TrophyOutlined, StarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import inventoryService from '../../services/inventoryService';
import './TopBuyersCards.css';

const { Title, Text } = Typography;

interface TopBuyer {
  buyerId: string;
  buyerName: string;
  totalSpending: number;
  ordersPlaced: number;
}

const TopBuyersCards: React.FC = () => {
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopBuyers = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getTopBuyers(10);
        setTopBuyers(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching top buyers:', err);
        setError('Failed to load top buyers data');
      } finally {
        setLoading(false);
      }
    };

    fetchTopBuyers();
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
      <div className="top-buyers-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading top buyers"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  if (!topBuyers || topBuyers.length === 0) {
    return (
      <Alert
        message="No buyers data available"
        description="No spending data found for buyers"
        type="info"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  // Split buyers into top 3 and rest
  const topThree = topBuyers.slice(0, 3);
  const restBuyers = topBuyers.slice(3);

  return (
    <div className="top-buyers-cards">
      <Title level={3} style={{ marginBottom: '24px', textAlign: 'center' }}>
        <ShoppingCartOutlined /> Top 10 Buyers by Spending
      </Title>
      
      {/* Top 3 Buyers - Special Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {topThree.map((buyer, index) => (
          <Col xs={24} sm={8} key={buyer.buyerId}>
            <Card 
              className={`top-buyer-card rank-${index + 1}`}
              style={{ 
                borderColor: getRankColor(index),
                boxShadow: `0 4px 12px ${getRankColor(index)}20`,
                textAlign: 'center'
              }}
            >
              <div className="buyer-card-content">
                <div className="buyer-rank" style={{ marginBottom: '12px' }}>
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
                  {buyer.buyerName}
                </Title>
                <div className="buyer-stats">
                  <Text strong style={{ color: getRankColor(index), fontSize: '18px' }}>
                    {formatCompactCurrency(buyer.totalSpending)}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {buyer.ordersPlaced} orders placed
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Rest of Buyers - Compact Cards */}
      {restBuyers.length > 0 && (
        <Row gutter={[16, 16]}>
          {restBuyers.map((buyer, index) => (
            <Col xs={24} sm={12} lg={6} key={buyer.buyerId}>
              <Card 
                className="buyer-card-compact"
                size="small"
                style={{ textAlign: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {getRankIcon(index + 3)}
                  <Avatar size={32} icon={<UserOutlined />} />
                  <Text strong style={{ fontSize: '14px' }}>
                    {buyer.buyerName}
                  </Text>
                </div>
                <div>
                  <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>
                    {formatCompactCurrency(buyer.totalSpending)}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {buyer.ordersPlaced} orders
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

export default TopBuyersCards;