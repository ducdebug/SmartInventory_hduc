import React, { useState, useEffect } from 'react';
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
  onShelf: boolean;
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
  const [storageConditions, setStorageConditions] = useState<StorageConditionInput[]>([]);
  const [products, setProducts] = useState<ProductInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      onShelf: true, // Default to true
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

  const handleOnShelfChange = (index: number, value: boolean) => {
    const updated = [...products];
    updated[index].onShelf = value;
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
            if (updated[index].conditionType === StorageCondition.HUMIDITY_CONTROLLED) {
        updated[index].unit = '%';
      }
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
        storageConditions,
        productDetails: products.map(p => ({ 
          ...p.details, 
          quantity: p.quantity,
          onShelf: p.onShelf
        }))
      };

      await inventoryService.storeBatch(payload);
      setShowSuccess(true);
      
      setTimeout(() => {
        onClose();
        setProductType('');
        setStorageStrategy(StorageStrategy.FIFO);
        setStorageConditions([]);
        setProducts([]);
        setShowSuccess(false);
        setErrorMessage(null);
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setShowSuccess(false);
      if (err.response && err.response.data && err.response.data.message) {
        let message = err.response.data.message;
               if (err.response.status === 460) {
          message = "⚠️ " + message;
        }
        setErrorMessage(message);
      } else {
        setErrorMessage('Failed to store batch. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatConditionType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Product Batch</h2>
          <button 
            onClick={() => {
              setErrorMessage(null);
              onClose();
            }} 
            className="close-button" 
            aria-label="Close modal"
          >×</button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <div className="form-section-title">
              <i className="section-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </i>
              Basic Information
            </div>
            
            <div className="form-group">
              <label className="form-label">Product Type<span className="required-mark">*</span></label>
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
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                Storage Conditions
              </h3>
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
            
            {storageConditions.length > 0 ? (
              <div className="condition-cards-container">
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
              </div>
            ) : (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p>No storage conditions added yet</p>
                <p className="empty-state-subtitle">Click "Add Condition" to specify storage requirements</p>
              </div>
            )}
          </div>

          <div className="form-section" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <div className="section-header">
              <h3 className="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Products<span className="required-mark">*</span>
              </h3>
              <button 
                onClick={handleAddProduct} 
                className="btn-primary btn-with-icon"
                disabled={!productType}
                title={!productType ? "Please select a product type first" : "Add a new product"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Product
              </button>
            </div>
            
            {products.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>No products added yet</p>
                <p className="empty-state-subtitle">
                  {!productType ? "Please select a product type first" : "Click \"Add Product\" to start creating your batch"}
                </p>
              </div>
            ) : (
              <div className="product-cards-container">
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Remove
                      </button>
                    </div>

                    <div className="product-field-row">
                      <div className="form-field">
                        <label className="form-field-label">Quantity<span className="required-mark">*</span></label>
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
                        <label className="form-field-label">Product Name<span className="required-mark">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter product name"
                          value={p.details.name}
                          onChange={e => handleProductChange(idx, 'name', e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>
                    
                    <div className="toggle-switch-container" style={{ marginBottom: '12px' }}>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={p.onShelf} 
                          onChange={e => handleOnShelfChange(idx, e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">Place on shelf</span>
                    </div>
                    
                    <div className="product-field-row">
                      <div className="form-field">
                        <label className="form-field-label">Price<span className="required-mark">*</span></label>
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
            )}
          </div>
        </div>

        <div className="modal-footer">
          {errorMessage && (
            <div className="error-message" style={{ 
              color: '#d32f2f', 
              background: '#ffebee', 
              padding: '10px 15px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errorMessage}
            </div>
          )}
          
          {showSuccess ? (
            <div className="success-message">
              <svg xmlns="http://www.w3.org/2000/svg" className="success-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Batch created successfully!
            </div>
          ) : (
            <>
              <button onClick={() => { setErrorMessage(null); onClose(); }} className="btn-cancel">Cancel</button>
              <button 
                onClick={handleSubmit} 
                className="btn-success"
                disabled={isSubmitting || products.length === 0 || !productType}
              >
                {isSubmitting ? (
                  <>
                    <svg className="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="none" strokeWidth="4" stroke="currentColor" strokeDasharray="32" strokeDashoffset="32">
                      </circle>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Batch'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchCreateModal;