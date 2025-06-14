import React from 'react';
import { Tabs, Card, Typography } from 'antd';
import { DollarOutlined, AreaChartOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import ProductPricingPage from './ProductPricingPage';

const { Title, Text } = Typography;

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
        <Text>Manage inventory configuration, pricing, and analytics</Text>
      </Card>

      <Tabs 
        defaultActiveKey="pricing" 
        type="card"
        items={[
          {
            key: 'pricing',
            label: <span><DollarOutlined /> Product Pricing</span>,
            children: <ProductPricingPage />,
          },
          {
            key: 'analytics',
            label: <span><AreaChartOutlined /> Advanced Analytics</span>,
            children: (
              <div style={{ padding: '20px' }}>
                <Card>
                  <Title level={4}>Advanced Analytics</Title>
                  <Text>This feature is coming soon.</Text>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdminInventoryPage;
