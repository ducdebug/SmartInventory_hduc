import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import { ProductType, StorageStrategy, StorageCondition } from '../../types/inventory';
import { Package, Plus, X, Settings, DollarSign, CheckCircle, AlertCircle, Loader2, Eye, ArrowLeft, Sparkles } from 'lucide-react';
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
    [key: string]: any;
  };
}

interface PriceCalculationResponse {
  basePrice: number;
  finalPrice: number;
  multiplier: number;
  currency: string;
  slotCount: number;
  breakdown: string;
}

const BatchCreateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [productType, setProductType] = useState<ProductType | ''>('');
  const [storageStrategy, setStorageStrategy] = useState<StorageStrategy>(StorageStrategy.FIFO);
  const [storageConditions, setStorageConditions] = useState<StorageConditionInput[]>([]);
  const [products, setProducts] = useState<ProductInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Price calculation states
  const [priceData, setPriceData] = useState<PriceCalculationResponse | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate price whenever products or storage conditions change
  useEffect(() => {
    if (isOpen && products.length > 0) {
      const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
      const estimatedSlots = Math.max(1, Math.ceil(totalQuantity / 10)); // Assume 10 products per slot
      const activeConditions = storageConditions
        .filter(cond => cond.conditionType)
        .map(cond => cond.conditionType);

      calculatePrice(estimatedSlots, activeConditions);
    }
  }, [products, storageConditions, isOpen]);

  const calculatePrice = async (slotCount: number, storageConditions: string[]) => {
    if (slotCount <= 0) {
      return;
    }

    setIsCalculatingPrice(true);
    setPriceError(null);

    try {
      const response = await inventoryService.calculatePrice({
        slotCount,
        storageConditions
      });
      setPriceData(response);
    } catch (error) {
      console.error('Price calculation failed:', error);
      setPriceError('Failed to calculate price');
      setPriceData(null);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

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

  const conditionLabels: { [key: string]: string } = {
    'TEMPERATURE_CONTROLLED': 'Temperature Controlled',
    'HUMIDITY_CONTROLLED': 'Humidity Controlled',
    'HAZARDOUS_MATERIALS': 'Hazardous Materials'
  };

  const conditionIcons: { [key: string]: string } = {
    'TEMPERATURE_CONTROLLED': '🌡️',
    'HUMIDITY_CONTROLLED': '💧',
    'HAZARDOUS_MATERIALS': '⚠️'
  };

  const resetModal = () => {
    setProductType('');
    setStorageStrategy(StorageStrategy.FIFO);
    setStorageConditions([]);
    setProducts([]);
    setShowSuccess(false);
    setErrorMessage(null);
    setPriceData(null);
    setPriceError(null);
    setShowConfirmation(false);
  };

  const closeModal = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const handleAddProduct = () => {
    setProducts([...products, {
      quantity: 1,
      onShelf: true, 
      details: {
        name: ''
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
    updated[index].quantity = Math.max(1, value);
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
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => <option key={size} value={size}>{size}</option>)}
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

  const handleCreateBatch = async () => {
    if (!productType || products.length === 0) {
      setErrorMessage('Please select a product type and add at least one product');
      return;
    }

    if (!priceData) {
      setErrorMessage('Please wait for price calculation to complete');
      return;
    }

    // Show confirmation dialog first
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        productType,
        storageStrategy,
        storageConditions: storageConditions.filter(c => c.conditionType),
        productDetails: products.map(p => ({ 
          ...p.details, 
          quantity: p.quantity,
          onShelf: p.onShelf
        })),
        calculatedPrice: priceData.finalPrice
      };

      await inventoryService.storeBatch(payload);
      setShowSuccess(true);
      
      setTimeout(() => {
        closeModal();
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
    <div className="modal-overlay" onClick={closeModal} aria-modal="true">
      <div className="enhanced-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <Package className="header-icon" />
            </div>
            <div className="modal-title-section">
              <h2 className="modal-title">Create Product Batch</h2>
              <p className="modal-subtitle">Set up a new batch with storage conditions and fee calculation</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={closeModal}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleCreateBatch(); }} className="enhanced-modal-form">
          {/* Basic Information Section */}
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <Settings size={20} />
              </div>
              <h3 className="form-card-title">Basic Information</h3>
            </div>
            <div className="form-card-content">
              <div className="input-group">
                <label htmlFor="productType" className="input-label">
                  Product Type <span className="required-asterisk">*</span>
                </label>
                <select
                  id="productType"
                  value={productType}
                  onChange={e => {
                    setProductType(e.target.value as ProductType);
                    setProducts([]);
                  }}
                  className="enhanced-input"
                  required
                >
                  <option value="">Select Product Type</option>
                  {Object.values(ProductType).map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="storageStrategy" className="input-label">
                  Storage Strategy
                </label>
                <select
                  id="storageStrategy"
                  value={storageStrategy}
                  onChange={e => setStorageStrategy(e.target.value as StorageStrategy)}
                  className="enhanced-input"
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
          </div>

          {/* Storage Conditions Section */}
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <Sparkles size={20} />
              </div>
              <h3 className="form-card-title">Storage Conditions</h3>
              <p className="form-card-subtitle">Define special environmental requirements for this batch</p>
            </div>
            <div className="form-card-content">
              <div className="conditions-list">
                {storageConditions.map((cond, idx) => (
                  <div key={idx} className="condition-card">
                    <div className="condition-card-header">
                      <div className="condition-number">{idx + 1}</div>
                      <button
                        type="button"
                        onClick={() => removeStorageCondition(idx)}
                        className="condition-remove-btn"
                        aria-label={`Remove condition ${idx + 1}`}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="condition-card-content">
                      <div className="condition-type-select">
                        <label className="input-label">Condition Type</label>
                        <select
                          value={cond.conditionType}
                          onChange={e => handleStorageConditionChange(idx, 'conditionType', e.target.value)}
                          className="enhanced-select"
                        >
                          {Object.values(StorageCondition).map(c => (
                            <option key={c} value={c}>
                              {conditionIcons[c]} {conditionLabels[c] || formatConditionType(c)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {cond.conditionType !== StorageCondition.HAZARDOUS_MATERIALS && (
                        <div className="condition-values">
                          <div className="value-input-group">
                            <label className="input-label">Min Value</label>
                            <input
                              type="number"
                              placeholder="Minimum"
                              value={cond.minValue}
                              onChange={e => handleStorageConditionChange(idx, 'minValue', Number(e.target.value))}
                              className="enhanced-input small"
                            />
                          </div>

                          <div className="value-input-group">
                            <label className="input-label">Max Value</label>
                            <input
                              type="number"
                              placeholder="Maximum"
                              value={cond.maxValue}
                              onChange={e => handleStorageConditionChange(idx, 'maxValue', Number(e.target.value))}
                              className="enhanced-input small"
                            />
                          </div>

                          <div className="value-input-group">
                            <label className="input-label">Unit</label>
                            <input
                              placeholder="Unit"
                              value={cond.unit}
                              className="enhanced-input small disabled"
                              disabled
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addStorageCondition}
                className="add-condition-btn"
              >
                <Plus size={18} />
                Add Storage Condition
              </button>
            </div>
          </div>

          {/* Products Section */}
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <Package size={20} />
              </div>
              <h3 className="form-card-title">Products <span className="required-asterisk">*</span></h3>
              <p className="form-card-subtitle">Add products to this batch</p>
            </div>
            <div className="form-card-content">
              {products.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} />
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
                          <X size={16} />
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
                      
                      {/* Product type specific fields */}
                      {renderFieldsForProduct(idx)}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddProduct}
                className="add-condition-btn"
                disabled={!productType}
                title={!productType ? "Please select a product type first" : "Add a new product"}
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>
          </div>

          {/* Price Calculation Section */}
          <div className="form-card price-card">
            <div className="form-card-header">
              <div className="form-card-icon price-icon">
                <DollarSign size={20} />
              </div>
              <h3 className="form-card-title">Cost Estimation</h3>
              <p className="form-card-subtitle">Monthly maintenance cost for this batch storage</p>
            </div>
            <div className="form-card-content">
              <div className="price-calculation-container">
                {isCalculatingPrice && (
                  <div className="price-loading">
                    <Loader2 className="price-spinner" size={24} />
                    <div className="price-loading-text">
                      <div className="loading-title">Calculating storage cost...</div>
                      <div className="loading-subtitle">This may take a few seconds</div>
                    </div>
                  </div>
                )}

                {priceError && !isCalculatingPrice && (
                  <div className="price-error">
                    <AlertCircle className="error-icon" size={24} />
                    <div className="error-content">
                      <div className="error-title">Failed to calculate cost</div>
                      <div className="error-subtitle">{priceError}</div>
                    </div>
                  </div>
                )}

                {priceData && !isCalculatingPrice && !priceError && (
                  <div className="price-success">
                    <div className="price-main-display">
                      <div className="price-amount">
                        <div className="price-currency">$</div>
                        <div className="price-value">{priceData.finalPrice.toFixed(2)}</div>
                        <div className="price-period">/{priceData.currency} per month</div>
                      </div>
                      <div className="price-per-slot">
                        <div className="per-slot-label">Per slot/month</div>
                        <div className="per-slot-value">${(priceData.finalPrice / priceData.slotCount).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="price-breakdown-grid">
                      <div className="breakdown-item">
                        <div className="breakdown-label">Base Price</div>
                        <div className="breakdown-value base">${priceData.basePrice.toFixed(2)}</div>
                      </div>
                      <div className="breakdown-item">
                        <div className="breakdown-label">Estimated Slots</div>
                        <div className="breakdown-value slots">{priceData.slotCount}</div>
                      </div>
                      <div className="breakdown-item">
                        <div className="breakdown-label">Multiplier</div>
                        <div className={`breakdown-value multiplier ${priceData.multiplier > 1.5 ? 'high' : priceData.multiplier > 1.0 ? 'medium' : 'low'}`}>
                          {priceData.multiplier.toFixed(1)}x
                        </div>
                      </div>
                    </div>

                    {priceData.multiplier > 1.0 && (
                      <div className="cost-impact-notice">
                        <div className="impact-icon">💡</div>
                        <div className="impact-text">
                          Special storage conditions increase costs by <strong>{((priceData.multiplier - 1) * 100).toFixed(0)}%</strong>
                        </div>
                      </div>
                    )}

                    <details className="price-breakdown-details">
                      <summary className="breakdown-summary">
                        View detailed cost breakdown
                      </summary>
                      <div className="breakdown-details-content">
                        <pre className="breakdown-text">{priceData.breakdown}</pre>
                      </div>
                    </details>
                  </div>
                )}

                {!isCalculatingPrice && !priceError && !priceData && products.length === 0 && (
                  <div className="price-placeholder">
                    <div className="placeholder-icon">💰</div>
                    <div className="placeholder-text">
                      <div className="placeholder-title">Cost calculation ready</div>
                      <div className="placeholder-subtitle">Add products to see storage cost estimates</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="error-message-card">
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="success-message-card">
              <CheckCircle size={20} />
              <span>Batch created successfully!</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="enhanced-modal-actions">
            {showConfirmation && priceData ? (
              <div className="confirmation-section">
                <div className="confirmation-card">
                  <div className="confirmation-header">
                    <CheckCircle className="confirmation-icon" size={28} />
                    <div className="confirmation-content">
                      <h4 className="confirmation-title">Confirm Batch Creation</h4>
                      <p className="confirmation-text">
                        You are about to create a batch with <strong>{products.length}</strong> products and a monthly storage cost of:
                      </p>
                    </div>
                  </div>

                  <div className="confirmation-price">
                    <div className="confirmation-amount">
                      ${priceData.finalPrice.toFixed(2)} {priceData.currency}
                    </div>
                    <div className="confirmation-period">per month</div>
                  </div>

                  <div className="confirmation-warning">
                    This cost will be charged monthly for batch storage and cannot be changed after creation.
                  </div>
                </div>

                <div className="confirmation-actions">
                  <button
                    type="button"
                    onClick={handleCreateBatch}
                    className="confirm-create-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="btn-spinner" size={18} />
                        Creating Batch...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Yes, Create Batch
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="confirm-cancel-btn"
                  >
                    <ArrowLeft size={18} />
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="normal-actions">
                <button
                  type="submit"
                  className="enhanced-submit-btn"
                  disabled={!priceData || isCalculatingPrice || !productType || products.length === 0 || isSubmitting}
                  title={
                    !productType ? 'Please select a product type' :
                    products.length === 0 ? 'Please add at least one product' :
                    isCalculatingPrice ? 'Please wait for price calculation' :
                    !priceData ? 'Price calculation required before creating batch' :
                    `Review and confirm batch creation with monthly cost of $${priceData.finalPrice.toFixed(2)}`
                  }
                >
                  {isCalculatingPrice ? (
                    <>
                      <Loader2 className="btn-spinner" size={18} />
                      Calculating Cost...
                    </>
                  ) : priceData && products.length > 0 ? (
                    <>
                      <Eye size={18} />
                      Review & Create (${priceData.finalPrice.toFixed(2)}/month)
                    </>
                  ) : (
                    <>
                      <DollarSign size={18} />
                      {products.length === 0 ? 'Add Products First' : 'Calculate Price First'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="enhanced-cancel-btn"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchCreateModal;