import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  message,
  Collapse,
  Typography,
  Spin,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Select,
  Checkbox,
} from 'antd';
import { EditOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import inventoryService from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import './SupplierPricingPage.css';

const { Panel } = Collapse;
const { Title, Text } = Typography;
const { Option } = Select;

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

interface EditableProduct extends LotProduct {
  isEditing: boolean;
  newPrice: number;
  currency: string;
  isSelected: boolean;
}

const SupplierPricingPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [editableProducts, setEditableProducts] = useState<Record<string, EditableProduct[]>>({});
  const [savingLotId, setSavingLotId] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.role !== 'SUPPLIER') {
      message.error('You do not have permission to access this page');
      return;
    }
    
    fetchProductsByLot();
  }, [user]);
  
  useEffect(() => {
    console.log('editableProducts state updated:', editableProducts);
  }, [editableProducts]);

  const fetchProductsByLot = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProductsByLotForSupplier();
      setLots(response || []);
      
      const editableProdMap: Record<string, EditableProduct[]> = {};
      const initialSelectAllState: Record<string, boolean> = {};
      
      (response || []).forEach((lot: ProductLot) => {
        editableProdMap[lot.lotId] = (lot.products || []).map(product => {
          const primaryPrice = product.primaryPrice || { value: 0, currency: 'VND' };
          const secondaryPrice = product.secondaryPrice;
          
          return {
            ...product,
            isEditing: false,
            primaryPrice: primaryPrice,
            newPrice: secondaryPrice?.value || (primaryPrice.value * 1.2),
            currency: secondaryPrice?.currency || primaryPrice.currency || 'VND',
            isSelected: false
          };
        });
        initialSelectAllState[lot.lotId] = false;
      });
      
      setEditableProducts(editableProdMap);
      setSelectAll(initialSelectAllState);
    } catch (error) {
      console.error('Error fetching products by lot:', error);
      message.error('Failed to load product pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = React.useCallback((lotId: string, productId: string) => {
    console.log('Edit button clicked for:', { lotId, productId });
    
    setEditableProducts(prev => {
      const currentProducts = prev[lotId] || [];
      console.log('Current products for lotId:', lotId, currentProducts);
      
      const updatedProducts = [...currentProducts];
      const productIndex = updatedProducts.findIndex(p => p.productId === productId);
      console.log('Product index:', productIndex);
      
      if (productIndex >= 0) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          isEditing: true
        };
        console.log('Product updated to editing mode:', updatedProducts[productIndex]);
      } else {
        console.log('Product not found in the array');
      }
      
      const newState = { ...prev };
      newState[lotId] = updatedProducts;
      return newState;
    });
  }, []);

  const handlePriceChange = (lotId: string, productId: string, value: number) => {
    setEditableProducts(prev => {
      const currentProducts = prev[lotId] || [];
      const updatedProducts = [...currentProducts];
      const productIndex = updatedProducts.findIndex(p => p.productId === productId);
      if (productIndex >= 0) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          newPrice: value
        };
      }
      return { ...prev, [lotId]: updatedProducts };
    });
  };

  const handleCurrencyChange = (lotId: string, productId: string, currency: string) => {
    setEditableProducts(prev => {
      const currentProducts = prev[lotId] || [];
      const updatedProducts = [...currentProducts];
      const productIndex = updatedProducts.findIndex(p => p.productId === productId);
      if (productIndex >= 0) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          currency: currency
        };
      }
      return { ...prev, [lotId]: updatedProducts };
    });
  };

  const handleProductSelect = (lotId: string, productId: string, checked: boolean) => {
    setEditableProducts(prev => {
      const currentProducts = prev[lotId] || [];
      const updatedProducts = [...currentProducts];
      const productIndex = updatedProducts.findIndex(p => p.productId === productId);
      
      if (productIndex >= 0) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          isSelected: checked
        };
      }
      
      const allSelected = updatedProducts.every(p => p.isSelected);
      setSelectAll(prev => ({
        ...prev,
        [lotId]: allSelected
      }));
      
      return { ...prev, [lotId]: updatedProducts };
    });
  };

  const handleSelectAllProducts = (lotId: string, checked: boolean) => {
    setSelectAll(prev => ({
      ...prev,
      [lotId]: checked
    }));
    
    setEditableProducts(prev => {
      const currentProducts = prev[lotId] || [];
      const updatedProducts = currentProducts.map(product => ({
        ...product,
        isSelected: checked
      }));
      
      return { ...prev, [lotId]: updatedProducts };
    });
  };

  const handleSaveLotPrices = async (lotId: string) => {
    try {
      setSavingLotId(lotId);
      
      const lotProducts = editableProducts[lotId] || [];
        const productsToUpdate = lotProducts
        .filter(p => p.isSelected || p.isEditing || !p.secondaryPrice)
        .map(p => ({
          productId: p.productId,
          price: p.newPrice,
          currency: p.currency
        }));

      if (productsToUpdate.length === 0) {
        message.info('No price changes to save');
        return;
      }

      await inventoryService.updateSecondaryPricesAsSupplier({
        productPrices: productsToUpdate
      });

      message.success('Prices updated successfully');
      
      setEditableProducts(prev => {
        const currentProducts = prev[lotId] || [];
        const updatedProducts = currentProducts.map(product => {
          if (productsToUpdate.some(p => p.productId === product.productId)) {
            return {
              ...product,
              isEditing: false,
              isSelected: false,
              secondaryPrice: {
                id: product.secondaryPrice?.id || '',
                value: product.newPrice,
                currency: product.currency
              }
            };
          }
          return {
            ...product,
            isSelected: false 
          };
        });
        return { ...prev, [lotId]: updatedProducts };
      });
      
      setSelectAll(prev => ({
        ...prev,
        [lotId]: false
      }));
      fetchProductsByLot();
    } catch (error) {
      console.error('Error saving prices:', error);
      message.error('Failed to update prices');
    } finally {
      setSavingLotId(null);
    }
  };

  const handleBulkMarkup = async (lotId: string, percentage: number) => {
    try {
      setSavingLotId(lotId);
      
      const currentProducts = editableProducts[lotId] || [];
      const anySelected = currentProducts.some(p => p.isSelected);
      
      const productsToUpdate = currentProducts
        .filter(p => anySelected ? p.isSelected : true)
        .map(p => ({
          productId: p.productId,
          price: 0,
          currency: p.primaryPrice?.currency || 'VND'
        }));
      
      if (productsToUpdate.length === 0) {
        message.info('No products selected for markup');
        return;
      }
      
      await inventoryService.updateSecondaryPricesAsSupplier({
        productPrices: productsToUpdate,
        bulkMarkupPercentage: percentage
      });
      
      message.success('Markup applied successfully');
      
      setEditableProducts(prev => {
        const updatedProducts = currentProducts.map(p => ({
          ...p,
          isSelected: false
        }));
        return { ...prev, [lotId]: updatedProducts };
      });
      
      setSelectAll(prev => ({
        ...prev,
        [lotId]: false
      }));
      
      fetchProductsByLot();
    } catch (error) {
      console.error('Error applying markup:', error);
      message.error('Failed to apply markup');
    } finally {
      setSavingLotId(null);
    }
  };

  const handleSetBulkPrice = async (lotId: string, price: number, currency: string) => {
    try {
      setSavingLotId(lotId);
      
      const currentProducts = editableProducts[lotId] || [];
      
      const productsToUpdate = currentProducts
        .filter(p => p.isSelected)
        .map(p => ({
          productId: p.productId,
          price: 0,
          currency: currency
        }));
      
      if (productsToUpdate.length === 0) {
        message.info('No products selected');
        return;
      }
      
      await inventoryService.updateSecondaryPricesAsSupplier({
        productPrices: productsToUpdate,
        bulkPrice: price,
        currency: currency
      });
      
      message.success('Price updated successfully');
      
      setEditableProducts(prev => {
        const updatedProducts = currentProducts.map(p => ({
          ...p,
          isSelected: false
        }));
        return { ...prev, [lotId]: updatedProducts };
      });
      
      setSelectAll(prev => ({
        ...prev,
        [lotId]: false
      }));
      
      fetchProductsByLot();
    } catch (error) {
      console.error('Error setting bulk price:', error);
      message.error('Failed to update prices');
    } finally {
      setSavingLotId(null);
    }
  };

  const renderPriceColumn = (product: EditableProduct, lotId: string) => {
    console.log('Rendering price column for product:', product.productId, 'in lot:', lotId, 'isEditing:', product.isEditing);
    
    if (product.isEditing) {
      return (
        <div className="supplier-pricing-edit-controls">
          <InputNumber
            min={0}
            value={product.newPrice || 0}
            onChange={(value: number | null) => handlePriceChange(lotId, product.productId, Number(value) || 0)}
            className="supplier-pricing-price-input"
          />
          <Select
            value={product.currency || 'VND'}
            onChange={(value: string) => handleCurrencyChange(lotId, product.productId, value)}
            className="supplier-pricing-currency-select"
          >
            <Option value="VND">VND</Option>
            <Option value="USD">USD</Option>
            <Option value="EUR">EUR</Option>
          </Select>
        </div>
      );
    }

    return (
      <Space direction="vertical">
        {product.secondaryPrice ? (
          <Text>
            {(product.secondaryPrice.value || 0).toLocaleString()} {product.secondaryPrice.currency || 'VND'}
          </Text>
        ) : (
          <Text type="warning" className="supplier-pricing-warning-price">
            <WarningOutlined /> Not set
          </Text>
        )}
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            console.log('Edit button clicked from UI for lot:', lotId, 'product:', product.productId);
            e.stopPropagation();
            handleEdit(lotId, product.productId);
          }}
        >
          Edit
        </Button>
      </Space>
    );
  };

  const handleBulkMarkupClick = (lotId: string) => {
    let markupPercentage = 20;
    
    Modal.confirm({
      title: 'Apply Bulk Markup',
      content: (
        <div>
          <p>Set a percentage markup for {hasSelectedProducts(lotId) ? 'selected' : 'all'} products in this lot based on their primary prices.</p>
          <Form layout="vertical">
            <Form.Item label="Markup Percentage">
              <InputNumber
                min={0}
                defaultValue={markupPercentage}
                onChange={(value: number | null) => { markupPercentage = Number(value) }}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </div>
      ),
      onOk: () => handleBulkMarkup(lotId, markupPercentage),
    });
  };

  const handleSetPriceClick = (lotId: string) => {
    let price = 0;
    let currency = 'VND';
    
    Modal.confirm({
      title: 'Set Price for Selected Products',
      content: (
        <div>
          <p>Set a fixed price for the selected products:</p>
          <Form layout="vertical">
            <Form.Item label="Price">
              <InputNumber
                min={0}
                defaultValue={price}
                onChange={(value: number | null) => { price = Number(value) }}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="Currency">
              <Select
                defaultValue={currency}
                onChange={(value: string) => { currency = value }}
                style={{ width: '100%' }}
              >
                <Option value="VND">VND</Option>
                <Option value="USD">USD</Option>
                <Option value="EUR">EUR</Option>
              </Select>
            </Form.Item>
          </Form>
        </div>
      ),
      onOk: () => handleSetBulkPrice(lotId, price, currency),
    });
  };

  const hasSelectedProducts = (lotId: string): boolean => {
    const products = editableProducts[lotId] || [];
    return products.some(product => product.isSelected);
  };

  const getSelectedCount = (lotId: string): number => {
    const products = editableProducts[lotId] || [];
    return products.filter(product => product.isSelected).length;
  };

  if (user?.role !== 'SUPPLIER') {
    return <Card><Text type="danger">You do not have permission to access this page. This page is only accessible to suppliers.</Text></Card>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={3}>Supplier: Product Pricing Management</Title>
        <Text>Set the secondary (selling) prices for products by lot. Use checkboxes to select multiple products for bulk actions.</Text>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Collapse 
          accordion 
          className="supplier-pricing-table"
        >
          {lots.map((lot) => (
            <Panel 
              className="supplier-pricing-lot-panel"
              header={
                <div className="supplier-pricing-lot-header-info">
                  <span><strong>Lot:</strong> {lot.lotCode}</span>
                  <span><strong>Import Date:</strong> {new Date(lot.importDate).toLocaleDateString()}</span>
                  <span><strong>Products:</strong> {lot.products.length}</span>
                  {getSelectedCount(lot.lotId) > 0 && (
                    <span className="supplier-pricing-selection-count">
                      {getSelectedCount(lot.lotId)} product(s) selected
                    </span>
                  )}
                </div>
              } 
              key={lot.lotId}
              extra={
                <div className="supplier-pricing-bulk-actions">
                  <Button 
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleBulkMarkupClick(lot.lotId); }}
                  >
                    Bulk Markup
                  </Button>
                  {hasSelectedProducts(lot.lotId) && (
                    <Button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleSetPriceClick(lot.lotId); }}
                    >
                      Set Price for Selected
                    </Button>
                  )}
                  <Button 
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleSaveLotPrices(lot.lotId); }}
                    loading={savingLotId === lot.lotId}
                    className="supplier-pricing-save-btn"
                  >
                    Save Changes
                  </Button>
                </div>
              }
            >
              <Table 
                columns={[
                  {
                    title: () => (
                      <Checkbox 
                        checked={selectAll[lot.lotId] || false} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAllProducts(lot.lotId, e.target.checked)}
                      >
                        Select
                      </Checkbox>
                    ),
                    dataIndex: 'select',
                    key: 'select',
                    width: '60px',
                    render: (text: string, record: EditableProduct) => (
                      <Checkbox 
                        checked={record.isSelected} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProductSelect(lot.lotId, record.productId, e.target.checked)}
                      />
                    ),
                  },
                  {
                    title: 'Product',
                    dataIndex: 'productName',
                    key: 'productName',
                    render: (text: string, record: EditableProduct) => (
                      <Space direction="vertical" size="small">
                        <Text strong>{text}</Text>
                        <Tag color="blue" className="supplier-pricing-product-tag">{record.productType}</Tag>
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
                    render: (text: string, record: EditableProduct) => 
                      renderPriceColumn(record, lot.lotId)
                  },
                  {
                    title: 'Details',
                    key: 'details',
                    render: (text: string, record: EditableProduct) => (
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
                dataSource={editableProducts[lot.lotId]} 
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

export default SupplierPricingPage;