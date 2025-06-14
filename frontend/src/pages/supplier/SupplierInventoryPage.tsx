import React from 'react';
import { Tabs, Card, Typography } from 'antd';
import { DollarOutlined, AreaChartOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import SupplierPricingPage from './SupplierPricingPage';
import SupplierLotHistory from './SupplierLotHistory';

const { Title, Text } = Typography;

const SupplierInventoryPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'SUPPLIER') {
    return (
      <Card>
        <Text type="danger">You do not have permission to access this page. This page is only accessible to suppliers.</Text>
      </Card>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ marginBottom: '20px' }}>
        <Title level={3}>Supplier: Inventory Management</Title>
        <Text>Manage product pricing and inventory analytics</Text>
      </Card>

      <Tabs 
        defaultActiveKey="pricing" 
        type="card"
        items={[
          {
            key: 'pricing',
            label: <span><DollarOutlined /> Product Pricing</span>,
            children: <SupplierPricingPage />,
          },
          {
            key: 'history',
            label: <span><HistoryOutlined /> Import History</span>,
            children: <SupplierLotHistory />,
          },
          {
            key: 'analytics',
            label: <span><AreaChartOutlined /> Inventory Analytics</span>,
            children: (
              <div style={{ padding: '20px' }}>
                <Card>
                  <Title level={4}>Inventory Analytics</Title>
                  <Text>Analytics features for suppliers coming soon.</Text>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SupplierInventoryPage;