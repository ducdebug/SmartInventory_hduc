import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  message,
  Collapse,
  Typography,
  Spin,
  Space,
  Tag,
  Tooltip,
  Button,
} from 'antd';
import { EyeOutlined, WarningOutlined } from '@ant-design/icons';
import inventoryService from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';

const { Panel } = Collapse;
const { Title, Text } = Typography;

interface LotProduct {
  productId: string;
  productName: string;
  productType: string;
  primaryPrice: {
    id: string;
    value: number;
    currency: string;
  };
  secondaryPrice?: {
    id: string;
    value: number;
    currency: string;
  };
  details: Record<string, any>;
}

interface ProductLot {
  lotId: string;
  lotCode: string;
  importDate: string;
  importedByUser: string;
  products: LotProduct[];
}

interface DisplayProduct extends LotProduct {
  // No editing fields needed for view-only
}

const ProductPricingPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Record<string, DisplayProduct[]>>({});

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      message.error('You do not have permission to access this page');
      return;
    }
    
    fetchProductsByLot();
  }, [user]);

  const fetchProductsByLot = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProductsByLot();
      setLots(response || []);
      
      const displayProdMap: Record<string, DisplayProduct[]> = {};
      
      (response || []).forEach((lot: ProductLot) => {
        displayProdMap[lot.lotId] = (lot.products || []).map(product => {
          const primaryPrice = product.primaryPrice || { value: 0, currency: 'VND' };
          
          return {
            ...product,
            primaryPrice: primaryPrice
          };
        });
      });
      
      setDisplayProducts(displayProdMap);
    } catch (error) {
      console.error('Error fetching products by lot:', error);
      message.error('Failed to load product pricing data');
    } finally {
      setLoading(false);
    }
  };

  const renderPriceColumn = (product: DisplayProduct) => {
    return (
      <Space direction="vertical">
        {product.secondaryPrice ? (
          <Text>
            {(product.secondaryPrice.value || 0).toLocaleString()} {product.secondaryPrice.currency || 'VND'}
          </Text>
        ) : (
          <Text type="warning">
            <WarningOutlined /> Not set by supplier
          </Text>
        )}
        <Text type="secondary" style={{ fontSize: '12px' }}>
          (View only)
        </Text>
      </Space>
    );
  };

  if (user?.role !== 'ADMIN') {
    return <Card><Text type="danger">You do not have permission to access this page</Text></Card>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={3}>Admin: Product Pricing Overview</Title>
        <Text>View the secondary (selling) prices for products by lot. Prices are managed by suppliers.</Text>
        <br />
        <Text type="secondary" style={{ fontStyle: 'italic' }}>
          Note: This is a read-only view. Suppliers are responsible for setting secondary prices.
        </Text>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Collapse 
          accordion 
          style={{ marginTop: '20px' }}
        >
          {lots.map((lot) => (
            <Panel 
              header={
                <Space>
                  <span><strong>Lot:</strong> {lot.lotCode}</span>
                  <span><strong>Import Date:</strong> {new Date(lot.importDate).toLocaleDateString()}</span>
                  <span><strong>Products:</strong> {lot.products.length}</span>
                  <span><strong>Imported by:</strong> {lot.importedByUser}</span>
                </Space>
              } 
              key={lot.lotId}
              extra={
                <Button 
                  icon={<EyeOutlined />}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}
                >
                  View Only
                </Button>
              }
            >
              <Table 
                columns={[
                  {
                    title: 'Product',
                    dataIndex: 'productName',
                    key: 'productName',
                    render: (text: string, record: DisplayProduct) => (
                      <Space direction="vertical" size="small">
                        <Text strong>{text}</Text>
                        <Tag color="blue">{record.productType}</Tag>
                      </Space>
                    ),
                  },
                  {
                    title: 'Primary Price (Import)',
                    dataIndex: 'primaryPrice',
                    key: 'primaryPrice',
                    render: (price: { value: number; currency: string } | undefined) => {
                      if (!price) {
                        return <Text type="warning">No price data</Text>;
                      }
                      return <Text>{(price.value || 0).toLocaleString()} {price.currency || 'VND'}</Text>;
                    },
                  },
                  {
                    title: 'Secondary Price (Export)',
                    key: 'secondaryPrice',
                    render: (text: string, record: DisplayProduct) => 
                      renderPriceColumn(record)
                  },
                  {
                    title: 'Price Margin',
                    key: 'margin',
                    render: (text: string, record: DisplayProduct) => {
                      if (!record.secondaryPrice || !record.primaryPrice) {
                        return <Text type="secondary">N/A</Text>;
                      }
                      const margin = ((record.secondaryPrice.value - record.primaryPrice.value) / record.primaryPrice.value * 100);
                      const color = margin > 0 ? 'green' : margin < 0 ? 'red' : 'orange';
                      return (
                        <Text style={{ color }}>
                          {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                        </Text>
                      );
                    },
                  },
                  {
                    title: 'Details',
                    key: 'details',
                    render: (text: string, record: DisplayProduct) => (
                      <Tooltip
                        title={
                          <div>
                            {Object.entries(record.details || {}).map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {String(value || '')}
                              </div>
                            ))}
                          </div>
                        }
                      >
                        <Button type="dashed" size="small">View Details</Button>
                      </Tooltip>
                    ),
                  },
                ]} 
                dataSource={displayProducts[lot.lotId]} 
                rowKey="productId"
                pagination={false}
                size="middle"
              />
            </Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
};

export default ProductPricingPage;