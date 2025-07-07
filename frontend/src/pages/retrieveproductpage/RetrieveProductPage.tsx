import React from 'react';
import { Alert } from 'antd';
import './retrieveproductpage.css';

// This component is no longer used as the BUYER role has been removed
// The functionality has been integrated into the BuyerDashboard for SUPPLIER and TEMPORARY users

const RetrieveProductPage: React.FC = () => {
  return (
    <div className="retrieve-container">
      <h2 className="retrieve-title">Product Retrieval</h2>
      <Alert
        message="Feature No Longer Available"
        description="This page is no longer available as the BUYER role has been removed from the system. Product retrieval functionality is now available through the Product Catalog for authorized users."
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />
    </div>
  );
};

export default RetrieveProductPage;
