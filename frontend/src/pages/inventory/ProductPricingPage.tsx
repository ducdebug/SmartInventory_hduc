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
import { EyeOutlined } from '@ant-design/icons';
import inventoryService from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';

const { Panel } = Collapse;
const { Title, Text } = Typography;

interface LotProduct {
  productId: string;
  productName: string;
  productType: string;
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
  // View-only product information
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
        displayProdMap[lot.lotId] = (lot.products || []).map(product => ({
          ...product
        }));
      });
      
      setDisplayProducts(displayProdMap);
    } catch (error) {
      console.error('Error fetching products by lot:', error);
      message.error('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return <Card><Text type="danger">You do not have permission to access this page</Text></Card>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={3}>Admin: Product Overview</Title>
        <Text>View products organized by lot for inventory management.</Text>
        <br />
        <Text type="secondary" style={{ fontStyle: 'italic' }}>
          Note: This is a read-only view for product information.
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
                  View Products
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
                    title: 'Product ID',
                    dataIndex: 'productId',
                    key: 'productId',
                    render: (text: string) => (
                      <Text code>{text}</Text>
                    ),
                  },
                  {
                    title: 'Product Type',
                    dataIndex: 'productType',
                    key: 'productType',
                    render: (text: string) => (
                      <Tag color="green">{text}</Tag>
                    ),
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