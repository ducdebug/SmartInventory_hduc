import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import './home.css';
import ProductTypeChart from '../../components/inventory/ProductTypeChart';
import SectionsWidget from '../../components/sections/SectionsWidget';
import RevenueWidget from '../../components/revenue/RevenueWidget';
import Magnet from '../../components/advancedanimation/Magnet';
import inventoryService from '../../services/inventoryService';
import { Card, Row, Col, Statistic, Button, Spin, Alert } from 'antd';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  BarChartOutlined,
  AuditOutlined,
  ShopOutlined
} from '@ant-design/icons';

interface SummaryStatistics {
  totalProducts: number;
  overallUtilization: number;
  overallTurnoverRate: number;
  expiringProductsCount: number;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStatistics | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analytics = await inventoryService.getInventoryAnalytics();
        setSummaryStats(analytics.summaryStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory analytics:', err);
        setError('Failed to load inventory analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const renderUserSpecificActions = () => {
    if (user?.role === 'ADMIN') {
      return (
        <div className="role-actions">
          <h2>
            <InfoCircleOutlined /> Admin Quick Actions
          </h2>
          <div className="action-buttons">
            <Link to="/sections">
              <Button
                type="primary"
                icon={<AppstoreOutlined />}
                size="large"
                className="action-button"
              >
                Manage Sections
              </Button>
            </Link>
            <Link to="/user-management">
              <Button
                type="primary"
                icon={<AuditOutlined />}
                size="large"
                className="action-button"
              >
                User Management
              </Button>
            </Link>
            <Link to="/lot-history">
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                size="large"
                className="action-button"
              >
                Lot Management
              </Button>
            </Link>
            <Link to="/export-management">
              <Button
                type="primary"
                icon={<ShopOutlined />}
                size="large"
                className="action-button"
              >
                Export Management
              </Button>
            </Link>
          </div>
        </div>
      );
    } else if (user?.role === 'SUPPLIER') {
      return (
        <div className="role-actions">
          <h2>
            <InfoCircleOutlined /> Supplier Quick Actions
          </h2>
          <div className="action-buttons">
            <Link to="/inventory-supplier">
              <Button
                type="primary"
                icon={<AppstoreOutlined />}
                size="large"
                className="action-button"
              >
                Manage Inventory
              </Button>
            </Link>
            <Button
              type="primary"
              icon={<ShopOutlined />}
              size="large"
              className="action-button"
              onClick={() => document.dispatchEvent(new CustomEvent('open-batch-modal'))}
            >
              New Batch
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="home-wrapper">
      <main className="home-main">
        <div className="home-header">
          <Magnet padding={100} disabled={false} magnetStrength={100}>
            <h1 className="home-title">
              Welcome to Smart Inventory, {user?.username}
            </h1>
          </Magnet>
          <p className="home-subtitle">
            Your comprehensive dashboard for inventory management and analytics
          </p>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>Loading dashboard data...</p>
          </div>
        ) : error ? (
          <Alert
            message="Error Loading Data"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        ) : (
          <>
            {summaryStats && (
              <Row gutter={[16, 16]} className="stats-row">
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Total Products"
                      value={summaryStats.totalProducts}
                      prefix={<AppstoreOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Storage Utilization"
                      value={summaryStats.overallUtilization * 100}
                      precision={1}
                      suffix="%"
                      prefix={<ShopOutlined />}
                      valueStyle={summaryStats.overallUtilization > 0.8
                        ? { color: '#cf1322' }
                        : { color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Turnover Rate"
                      value={summaryStats.overallTurnoverRate}
                      precision={2}
                      prefix={<BarChartOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card className="stat-card alert-card">
                    <Statistic
                      title="Products Expiring Soon"
                      value={summaryStats.expiringProductsCount}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={summaryStats.expiringProductsCount > 10
                        ? { color: '#cf1322' }
                        : { color: '#faad14' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            <div className="home-content">
              {isAdmin && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                  <Col xs={24}>
                    <RevenueWidget />
                  </Col>
                </Row>
              )}

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card
                    title={<span><CalendarOutlined /> Inventory Analytics</span>}
                    className="overview-card"
                  >
                    <ProductTypeChart />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card
                    title={<span><InfoCircleOutlined /> Quick Access</span>}
                    className="actions-card"
                  >
                    {renderUserSpecificActions()}
                  </Card>
                </Col>
                {isAdmin && (
                  <Col xs={24} lg={12}>
                    <SectionsWidget />
                  </Col>
                )}
              </Row>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;