import React from 'react';
import { Typography, Divider, Alert } from 'antd';
import FinancialWidgets from '../../components/financial/FinancialWidgets';
import { useAuth } from '../../hooks/useAuth';
import './FinancialDashboard.css';

const { Title, Text } = Typography;

const FinancialDashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return (
      <div className="financial-dashboard-container">
        <Alert
          message="Access Restricted"
          description="This financial dashboard is only accessible to administrators."
          type="warning"
          showIcon
          style={{ margin: '20px', maxWidth: '600px' }}
        />
      </div>
    );
  }

  return (
    <div className="financial-dashboard-container">
      <div className="financial-dashboard-header">
        <Title level={2}>Financial Dashboard</Title>
        <Text type="secondary">
          Monitor supplier income, buyer spending, and overall financial performance
        </Text>
      </div>
      
      <Divider />
      
      <div className="financial-dashboard-content">
        <FinancialWidgets />
      </div>
    </div>
  );
};

export default FinancialDashboard;