import React, { useState } from 'react';
import inventoryService from '../../services/inventoryService';
import { ProductType, StorageStrategy, StorageCondition } from '../../types/inventory';
import './batchcreatemodal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface StorageConditionInput {
  conditionType: StorageCondition;
  minValue: number;
  maxValue: number;
  unit: string;
}

interface ProductInput {
  quantity: number;
  details: {
    name: string;
    price: number;
    currency: string;
    [key: string]: any;
  };
}

const BatchCreateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [productType, setProductType] = useState<ProductType | ''>('');
  const [storageStrategy, setStorageStrategy] = useState<StorageStrategy>(StorageStrategy.FIFO);
  const [onShelf, setOnShelf] = useState(true);
  const [storageConditions, setStorageConditions] = useState<StorageConditionInput[]>([]);
  const [products, setProducts] = useState<ProductInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getUnitForCondition = (conditionType: StorageCondition) => {
    switch (conditionType) {
      case StorageCondition.TEMPERATURE_CONTROLLED:
        return '°C';
      case StorageCondition.HUMIDITY_CONTROLLED:
        return '%';
      case StorageCondition.HAZARDOUS_MATERIALS:
        return ''; 
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  const handleAddProduct = () => {
    setProducts([...products, {
      quantity: 1,
      details: {
        name: '',
        price: 0,
        currency: 'VND'
      }
    }]);
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const updated = [...products];
    updated[index].details[field] = value;
    setProducts(updated);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const updated = [...products];
    updated[index].quantity = value;
    setProducts(updated);
  };

  const handleStorageConditionChange = (index: number, field: keyof StorageConditionInput, value: any) => {
    const updated = [...storageConditions];
    if (field === 'conditionType') {
      updated[index] = {
        ...updated[index],
        [field]: value,
        unit: getUnitForCondition(value as StorageCondition)
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setStorageConditions(updated);
  };

  const removeStorageCondition = (index: number) => {
    const updated = [...storageConditions];
    updated.splice(index, 1);
    setStorageConditions(updated);
  };

  const removeProduct = (index: number) => {
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
  };

  const addStorageCondition = () => {
    setStorageConditions([...storageConditions, {
      conditionType: StorageCondition.TEMPERATURE_CONTROLLED,
      minValue: 0,
      maxValue: 0,
      unit: '°C'
    }]);
  };

  const renderFieldsForProduct = (index: number) => {
    switch (productType) {
      case ProductType.FOOD:
        return (
          <div className="product-field-row">
            <div className="form-field">
              <label className="form-field-label">Ingredients</label>
              <input 
                className="input-field" 
                placeholder="Comma-separated list" 
                onChange={e => handleProductChange(index, 'ingredients', e.target.value.split(','))} 
              />
              <div className="form-helper-text">Enter ingredients separated by commas</div>
            </div>
            <div className="form-field">
              <label className="form-field-label">Expiration Date</label>
              <input 
                className="input-field" 
                type="date" 
                onChange={e => handleProductChange(index, 'expirationDate', e.target.value)} 
              />
            </div>
            <div className="form-field">
              <label className="form-field-label">Weight (g)</label>
              <input 
                className="input-field" 
                type="number" 
                min="0"
                placeholder="Weight in grams" 
                onChange={e => handleProductChange(index, 'weight', Number(e.target.value))} 
              />
            </div>
          </div>
        );
      case ProductType.CLOTHING:
        return (
          <div className="product-field-row">
            <div className="form-field">
              <label className="form-field-label">Material</label>
              <input 
                className="input-field" 
                placeholder="e.g. Cotton, Polyester" 
                onChange={e => handleProductChange(index, 'material', e.target.value)} 
              />
            </div>
            <div className="form-field">
              <label className="form-field-label">Size</label>
              <select 
                className="input-field select-field" 
                onChange={e => handleProductChange(index, 'size', e.target.value)}
              >
                <option value="">Select Size</option>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => <option key={size}>{size}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-field-label">Brand</label>
              <input 
                className="input-field" 
                placeholder="Brand name" 
                onChange={e => handleProductChange(index, 'brand', e.target.value)} 
              />
            </div>
          </div>
        );
      case ProductType.ELECTRONICS:
        return (
          <div className="product-field-row">
            <div className="form-field">
              <label className="form-field-label">Model Number</label>
              <input 
                className="input-field" 
                placeholder="e.g. ABC-123" 
                onChange={e => handleProductChange(index, 'modelNumber', e.target.value)} 
              />
            </div>
            <div className="form-field">
              <label className="form-field-label">Manufacturer</label>
              <input 
                className="input-field" 
                placeholder="Manufacturer name" 
                onChange={e => handleProductChange(index, 'manufacturer', e.target.value)} 
              />
            </div>
            <div className="form-field">
              <label className="form-field-label">Warranty (months)</label>
              <input 
                className="input-field" 
                type="number" 
                min="0"
                placeholder="Warranty period" 
                onChange={e => handleProductChange(index, 'warrantyMonths', Number(e.target.value))} 
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!productType || products.length === 0) {
      alert('Please select a product type and add at least one product');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        productType,
        storageStrategy,
        onShelf,
        storageConditions,
        productDetails: products.map(p => ({ ...p.details, quantity: p.quantity }))
      };

      await inventoryService.storeBatch(payload);
      setShowSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        onClose();
        // Reset the form
        setProductType('');
        setStorageStrategy(StorageStrategy.FIFO);
        setOnShelf(true);
        setStorageConditions([]);
        setProducts([]);
        setShowSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error(err);
      alert('Failed to store batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatConditionType = (type: string): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Product Batch</h2>
          <button onClick={onClose} className="close-button" aria-label="Close modal">×</button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <div className="form-section-title">
              <i>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </i>
              Basic Information
            </div>
            
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <select
                value={productType}
                onChange={e => {
                  setProductType(e.target.value as ProductType);
                  setProducts([]);
                }}
                className="input-field select-field"
              >
                <option value="">Select Product Type</option>
                {Object.values(ProductType).map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Storage Strategy</label>
              <select
                value={storageStrategy}
                onChange={e => setStorageStrategy(e.target.value as StorageStrategy)}
                className="input-field select-field"
              >
                {Object.values(StorageStrategy).map(strategy => (
                  <option key={strategy} value={strategy}>
                    {strategy} - {strategy === 'FIFO' ? 'First In, First Out' : 
                      strategy === 'LIFO' ? 'Last In, First Out' : 
                      strategy === 'FEFO' ? 'First Expired, First Out' : 
                      'By Nearest Location'}
                  </option>
                ))}
              </select>
            </div>

            <div className="checkbox-container">
              <input 
                type="checkbox" 
                id="onShelf" 
                checked={onShelf} 
                onChange={e => setOnShelf(e.target.checked)} 
                className="checkbox-input" 
              />
              <label htmlFor="onShelf" className="checkbox-label">Place on shelf</label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Storage Conditions</h3>
              <button 
                className="btn-secondary btn-with-icon" 
                onClick={addStorageCondition}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Condition
              </button>
            </div>
            
            {storageConditions.map((cond, idx) => (
              <div key={idx} className="condition-card">
                <div className="condition-card-header">
                  <span className="condition-type-label">Condition Type</span>
                  <button 
                    type="button" 
                    onClick={() => removeStorageCondition(idx)} 
                    className="remove-button"
                    aria-label="Remove condition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <select
                  value={cond.conditionType}
                  onChange={e => handleStorageConditionChange(idx, 'conditionType', e.target.value)}
                  className="input-field select-field"
                  style={{ marginBottom: '1rem' }}
                >
                  {Object.values(StorageCondition).map(c => (
                    <option key={c} value={c}>
                      {formatConditionType(c)}
                    </option>
                  ))}
                </select>
                
                {cond.conditionType !== StorageCondition.HAZARDOUS_MATERIALS && (
                  <div className="condition-value-container">
                    <div className="value-field-container">
                      <span className="value-field-label">Min</span>
                      <input
                        type="number"
                        value={cond.minValue}
                        onChange={e => handleStorageConditionChange(idx, 'minValue', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    
                    <div className="value-field-container">
                      <span className="value-field-label">Max</span>
                      <input
                        type="number"
                        value={cond.maxValue}
                        onChange={e => handleStorageConditionChange(idx, 'maxValue', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    
                    <div className="unit-display">{cond.unit}</div>
                  </div>
                )}
              </div>
            ))}
            
            {storageConditions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                <p>No storage conditions added yet. Click "Add Condition" to specify storage requirements.</p>
              </div>
            )}
          </div>

          <div className="form-section" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <div className="section-header">
              <h3 className="section-title">Products</h3>
              <button onClick={handleAddProduct} className="btn-primary btn-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Product
              </button>
            </div>
            
            {products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#94a3b8' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>No products added yet</p>
                <p>Click "Add Product" to start creating your batch</p>
              </div>
            )}
            
            {products.map((p, idx) => (
              <div key={idx} className="product-card">
                <div className="product-card-header">
                  <div className="product-number">
                    <span>{idx + 1}</span>
                    Product
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeProduct(idx)} 
                    className="btn-danger"
                  >
                    Remove
                  </button>
                </div>

                <div className="product-field-row">
                  <div className="form-field">
                    <label className="form-field-label">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={p.quantity}
                      onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                      placeholder="Quantity"
                      className="input-field"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="form-field-label">Product Name</label>
                    <input
                      type="text"
                      placeholder="Enter product name"
                      value={p.details.name}
                      onChange={e => handleProductChange(idx, 'name', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="product-field-row">
                  <div className="form-field">
                    <label className="form-field-label">Price</label>
                    <input
                      type="number"
                      placeholder="Enter price"
                      value={p.details.price}
                      onChange={e => handleProductChange(idx, 'price', Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="form-field-label">Currency</label>
                    <select
                      value={p.details.currency}
                      onChange={e => handleProductChange(idx, 'currency', e.target.value)}
                      className="input-field select-field"
                    >
                      {['VND', 'USD', 'EUR'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Product type specific fields */}
                {renderFieldsForProduct(idx)}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          {showSuccess ? (
            <div className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Batch created successfully!
            </div>
          ) : (
            <>
              <button onClick={onClose} className="btn-cancel">Cancel</button>
              <button 
                onClick={handleSubmit} 
                className="btn-success"
                disabled={isSubmitting || products.length === 0 || !productType}
                style={{ opacity: (isSubmitting || products.length === 0 || !productType) ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Creating...' : 'Create Batch'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchCreateModal;