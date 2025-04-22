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

const BatchCreateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [productType, setProductType] = useState<ProductType | ''>('');
  const [storageStrategy, setStorageStrategy] = useState<StorageStrategy>(StorageStrategy.FIFO);
  const [onShelf, setOnShelf] = useState(true);
  const [storageConditions, setStorageConditions] = useState<StorageConditionInput[]>([]);
  const [products, setProducts] = useState<any[]>([]);

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
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Ingredients (comma-separated)" onChange={e => handleProductChange(index, 'ingredients', e.target.value.split(','))} />
            <input className="input-field" type="date" onChange={e => handleProductChange(index, 'expirationDate', e.target.value)} />
            <input className="input-field" type="number" placeholder="Weight (g)" onChange={e => handleProductChange(index, 'weight', Number(e.target.value))} />
          </div>
        );
      case ProductType.CLOTHING:
        return (
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Material" onChange={e => handleProductChange(index, 'material', e.target.value)} />
            <select className="input-field" onChange={e => handleProductChange(index, 'size', e.target.value)}>
              <option value="">Select Size</option>
              {['XS', 'S', 'M', 'L', 'XL'].map(size => <option key={size}>{size}</option>)}
            </select>
            <input className="input-field" placeholder="Branch" onChange={e => handleProductChange(index, 'branch', e.target.value)} />
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!productType) return;

    const payload = {
      productType,
      storageStrategy,
      onShelf,
      storageConditions,
      productDetails: products.map(p => ({ ...p.details, quantity: p.quantity }))
    };

    try {
      await inventoryService.storeBatch(payload);
      alert('Batch stored successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to store batch');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-2xl font-bold">Create Product Batch</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Product Type</label>
            <select
              value={productType}
              onChange={e => {
                setProductType(e.target.value as ProductType);
                setProducts([]);
              }}
              className="input-field"
            >
              <option value="">Select Product Type</option>
              {Object.values(ProductType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Storage Strategy</label>
            <select
              value={storageStrategy}
              onChange={e => setStorageStrategy(e.target.value as StorageStrategy)}
              className="input-field"
            >
              {Object.values(StorageStrategy).map(strategy => (
                <option key={strategy} value={strategy}>{strategy}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center mb-4">
            <input type="checkbox" checked={onShelf} onChange={e => setOnShelf(e.target.checked)} className="mr-2" />
            <span>Place on shelf</span>
          </label>

          <div className="form-group">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Storage Conditions</h4>
              <button className="btn-secondary" onClick={addStorageCondition}>+ Add Condition</button>
            </div>
            {storageConditions.map((cond, idx) => (
              <div key={idx} className="condition-card">
                <select
                  value={cond.conditionType}
                  onChange={e => handleStorageConditionChange(idx, 'conditionType', e.target.value)}
                  className="input-field mb-2"
                >
                  {Object.values(StorageCondition).map(c => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                {cond.conditionType !== StorageCondition.HAZARDOUS_MATERIALS && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={cond.minValue}
                      onChange={e => handleStorageConditionChange(idx, 'minValue', Number(e.target.value))}
                      className="input-field flex-1"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={cond.maxValue}
                      onChange={e => handleStorageConditionChange(idx, 'maxValue', Number(e.target.value))}
                      className="input-field flex-1"
                    />
                    <div className="unit-display">{cond.unit}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="form-group">
            <button onClick={handleAddProduct} className="btn-primary mb-4">+ Add Product</button>
            {products.map((p, idx) => (
              <div key={idx} className="product-card">
                <h4 className="font-bold mb-2">Product #{idx + 1}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={1}
                    value={p.quantity}
                    onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                    placeholder="Quantity"
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={p.details.name}
                    onChange={e => handleProductChange(idx, 'name', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={p.details.price}
                    onChange={e => handleProductChange(idx, 'price', Number(e.target.value))}
                    className="input-field"
                  />
                  <select
                    value={p.details.currency}
                    onChange={e => handleProductChange(idx, 'currency', e.target.value)}
                    className="input-field"
                  >
                    {['VND', 'USD', 'EUR'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {renderFieldsForProduct(idx)}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleSubmit} className="btn-success">Submit</button>
          <button onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default BatchCreateModal;