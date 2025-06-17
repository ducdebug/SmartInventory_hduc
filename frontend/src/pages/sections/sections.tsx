import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SectionInfoResponse } from '../../types/inventory';
import inventoryService from '../../services/inventoryService';
import { useNavigate } from 'react-router-dom';
import './sections.css';

interface PriceCalculationResponse {
  basePrice: number;
  finalPrice: number;
  multiplier: number;
  currency: string;
  slotCount: number;
  breakdown: string;
}

const SectionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionInfoResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCondition, setFilterCondition] = useState<string>('');
  
  // Price calculation state
  const [priceData, setPriceData] = useState<PriceCalculationResponse | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    y_slot: 1,
    shelf_height: '',
    storageConditions: [{ conditionType: '', minValue: '', maxValue: '', unit: '' }]
  });

  useEffect(() => {
    fetchSections();
  }, []);

  // Calculate price when form data changes
  useEffect(() => {
    console.log('useEffect triggered:', { 
      isModalOpen, 
      y_slot: formData.y_slot, 
      storageConditions: formData.storageConditions 
    });
    
    if (isModalOpen && formData.y_slot > 0) {
      const activeConditions = formData.storageConditions
        .filter(cond => cond.conditionType)
        .map(cond => cond.conditionType);
      
      console.log('Active conditions:', activeConditions);
      console.log('Slot count:', formData.y_slot * 6);
      
      // Calculate price even with no conditions for testing
      calculatePrice(formData.y_slot * 6, activeConditions);
    }
  }, [formData.y_slot, formData.storageConditions, isModalOpen]);

  const calculatePrice = async (slotCount: number, storageConditions: string[]) => {
    console.log('calculatePrice called with:', { slotCount, storageConditions });
    
    if (slotCount <= 0) {
      console.log('Slot count is 0 or negative, skipping calculation');
      return;
    }
    
    setIsCalculatingPrice(true);
    setPriceError(null);
    
    try {
      console.log('Making API call to calculate price...');
      const response = await inventoryService.calculatePrice({
        slotCount,
        storageConditions
      });
      console.log('Price calculation response:', response);
      setPriceData(response);
      
      // Force re-render by updating a dummy state
      setTimeout(() => {
        console.log('Price data set, current state:', response);
      }, 100);
      
    } catch (error) {
      console.error('Price calculation failed:', error);
      setPriceError('Failed to calculate price');
      setPriceData(null);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const fetchSections = async () => {
    try {
      const data = await inventoryService.getSectionInfo();
      setSections(data);
    } catch (err) {
      setError('Failed to fetch inventory sections');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    navigate(`/sections/${sectionId}`);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setPriceData(null);
    setPriceError(null);
    
    // Add a test price calculation for debugging
    console.log('Modal opened, testing price calculation...');
    setTimeout(() => {
      calculatePrice(6, ['TEMPERATURE_CONTROLLED']); // Test with 1 slot and temp control
    }, 1000);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setPriceData(null);
    setPriceError(null);
  };

  const conditionUnits: { [key: string]: string } = {
    'TEMPERATURE_CONTROLLED': '°C',
    'HUMIDITY_CONTROLLED': '%',
    'HIGH_HUMIDITY': '%',
    'LOW_HUMIDITY': '%',
    'REFRIGERATED': '°C',
    'HAZARDOUS_MATERIALS': ''
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number,
    field?: 'conditionType' | 'minValue' | 'maxValue' | 'unit'
  ) => {
    if (typeof index === 'number' && field) {
      const updated = [...formData.storageConditions];
      if (field === 'conditionType') {
        const newUnit = conditionUnits[e.target.value] || '';
        updated[index] = {
          ...updated[index],
          conditionType: e.target.value,
          unit: newUnit
        };
      } else {
        updated[index] = { ...updated[index], [field]: e.target.value };
      }
      setFormData({ ...formData, storageConditions: updated });
    } else {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: name === 'y_slot' ? Math.max(1, Number(value)) : value });
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      storageConditions: [
        ...formData.storageConditions,
        { conditionType: '', minValue: '', maxValue: '', unit: '' }
      ]
    });
  };

  const removeCondition = (index: number) => {
    const updated = formData.storageConditions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      storageConditions: updated.length ? updated : [{ conditionType: '', minValue: '', maxValue: '', unit: '' }]
    });
  };

  const handleCreateSection = async () => {
    if (!priceData) {
      setError('Please wait for price calculation to complete');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        y_slot: Number(formData.y_slot),
        shelf_height: formData.shelf_height ? Number(formData.shelf_height) : undefined,
        calculatedPrice: priceData.finalPrice, // Include the calculated price
        storageConditions: formData.storageConditions
          .filter(c => c.conditionType)
          .map(c => ({
            conditionType: c.conditionType,
            minValue: c.minValue ? Number(c.minValue) : undefined,
            maxValue: c.maxValue ? Number(c.maxValue) : undefined,
            unit: c.unit || undefined
          }))
      };
      await inventoryService.createSection(payload);
      closeModal();
      fetchSections();
      setFormData({
        name: '',
        y_slot: 1,
        shelf_height: '',
        storageConditions: [{ conditionType: '', minValue: '', maxValue: '', unit: '' }]
      });
    } catch (err) {
      console.error('Create section error:', err);
      setError('Failed to create section');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCondition(e.target.value);
  };

  const filteredSections = filterCondition
    ? sections.filter(section =>
        section.storageConditions.some(cond => cond.conditionType === filterCondition)
      )
    : sections;

  return (
    <div className="sections-wrapper">
      <main className="sections-main" aria-label="Warehouse Layout">
        <div className="sections-header">
          <h1 className="sections-title">Warehouse Layout</h1>
          <div className="sections-controls">
            <button onClick={openModal} className="create-btn" aria-label="Create New Section">
              + Create Section
            </button>
            <select
              value={filterCondition}
              onChange={handleFilterChange}
              className="filter-dropdown"
              aria-label="Filter by condition"
            >
              <option value="">All Conditions</option>
              <option value="TEMPERATURE_CONTROLLED">Temperature Controlled</option>
              <option value="HUMIDITY_CONTROLLED">Humidity Controlled</option>
              <option value="HAZARDOUS_MATERIALS">Hazardous Materials</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-spinner" role="status" aria-label="Loading" />
        ) : error ? (
          <div className="error-message" role="alert">{error}</div>
        ) : filteredSections.length === 0 ? (
          <div className="no-sections-message" role="alert">No sections found</div>
        ) : (
          <div className="warehouse-layout">
            {(() => {
              const maxX = Math.max(...filteredSections.map(s => s.x), 0);
              const maxY = Math.max(...filteredSections.map(s => s.y), 0);
              
              const grid = Array(maxY + 1).fill(null).map(() => Array(maxX + 1).fill(null));
              
              filteredSections.forEach(section => {
                if (section.x <= maxX && section.y <= maxY) {
                  grid[section.y][section.x] = section;
                }
              });
              
              return grid.map((row, y) => (
                <div key={`row-${y}`} className="warehouse-row">
                  {row.map((section, x) => (
                    <div key={`cell-${x}-${y}`} className="warehouse-cell">
                      {section ? (
                        <button
                          className="section-box redesigned-section"
                          onClick={() => handleSectionClick(section.id)}
                          aria-label={`Section ${section.name}`}
                        >
                          <div className="section-header">
                            <h2 className="section-name">{section.name}</h2>
                            <span className="slot-info">
                              {section.usedSlots} / {section.totalSlots} slots used
                            </span>
                          </div>
                          <div className="section-body">
                            <p className="shelf-info">
                              <strong>Shelves:</strong> {section.numShelves > 0 ? section.numShelves : 'None'}
                            </p>
                            <div className="condition-info">
                              <strong>Conditions:</strong>
                              <ul className="condition-list">
                                {section.storageConditions.map((cond: { conditionType: string }, idx: number) => (
                                  <li key={idx} className="condition-item">
                                    <span className="condition-type">{cond.conditionType.replace(/_/g, ' ')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="empty-section"></div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal} aria-modal="true">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Section</h2>
            <form onSubmit={e => { e.preventDefault(); handleCreateSection(); }}>
              <div className="form-section">
                <label htmlFor="name">Section Name</label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter section name"
                />

                <label htmlFor="y_slot">Slot Height (y)</label>
                <input
                  id="y_slot"
                  type="number"
                  name="y_slot"
                  min={1}
                  value={formData.y_slot}
                  onChange={handleInputChange}
                  required
                />

                <label htmlFor="shelf_height">Shelf Height (optional)</label>
                <input
                  id="shelf_height"
                  type="number"
                  name="shelf_height"
                  min={1}
                  value={formData.shelf_height}
                  onChange={handleInputChange}
                  placeholder="Enter shelf height"
                />
              </div>

              <fieldset>
                <legend>Storage Conditions</legend>
                {formData.storageConditions.map((cond, idx) => (
                  <div key={idx} className="condition-row">
                    <select
                      value={cond.conditionType}
                      onChange={e => handleInputChange(e, idx, 'conditionType')}
                      aria-label={`Condition type ${idx + 1}`}
                    >
                      <option value="">-- Select Condition --</option>
                      <option value="TEMPERATURE_CONTROLLED">Temperature Controlled</option>
                      <option value="HUMIDITY_CONTROLLED">Humidity Controlled</option>
                      <option value="HAZARDOUS_MATERIALS">Hazardous Materials</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Min"
                      value={cond.minValue}
                      onChange={e => handleInputChange(e, idx, 'minValue')}
                      aria-label={`Minimum value ${idx + 1}`}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={cond.maxValue}
                      onChange={e => handleInputChange(e, idx, 'maxValue')}
                      aria-label={`Maximum value ${idx + 1}`}
                    />
                    <input
                      placeholder="Unit"
                      value={cond.unit}
                      onChange={e => handleInputChange(e, idx, 'unit')}
                      aria-label={`Unit ${idx + 1}`}
                      disabled
                    />
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      className="remove-btn"
                      aria-label={`Remove condition ${idx + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addCondition} className="add-btn">
                  + Add Condition
                </button>
              </fieldset>

              {/* Price Display Section */}
              <div className="price-section">
                <h3>Pricing Information</h3>
                
                {/* Always show debug info */}
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginBottom: '16px',
                  background: '#f0f0f0',
                  padding: '8px',
                  borderRadius: '4px'
                }}>
                  <div>State Debug:</div>
                  <div>• Calculating: {String(isCalculatingPrice)}</div>
                  <div>• Has Data: {String(!!priceData)}</div>
                  <div>• Error: {priceError || 'none'}</div>
                  <div>• Slots: {formData.y_slot * 6}</div>
                  {priceData && (
                    <div>• Final Price: ${priceData.finalPrice}</div>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => calculatePrice(6, ['TEMPERATURE_CONTROLLED'])}
                      style={{ fontSize: '10px', padding: '4px 8px', marginRight: '8px' }}
                    >
                      Test Price API
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        console.log('Current states:', { isCalculatingPrice, priceData, priceError });
                        // Force update with mock data for testing
                        setPriceData({
                          basePrice: 60,
                          finalPrice: 78,
                          multiplier: 1.3,
                          currency: 'USD',
                          slotCount: 6,
                          breakdown: 'Test breakdown'
                        });
                      }}
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                    >
                      Force Mock Data
                    </button>
                  </div>
                </div>
                
                {/* Simplified conditional rendering */}
                <div style={{ minHeight: '100px', border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
                  {isCalculatingPrice && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <div>Calculating price...</div>
                    </div>
                  )}
                  
                  {priceError && !isCalculatingPrice && (
                    <div style={{ color: 'red', textAlign: 'center' }}>
                      ⚠️ {priceError}
                    </div>
                  )}
                  
                  {priceData && !isCalculatingPrice && !priceError && (
                    <div>
                      <div style={{ 
                        backgroundColor: '#e3f2fd', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#1976d2' }}>Monthly Cost:</span>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
                          ${priceData.finalPrice.toFixed(2)} {priceData.currency}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#666' }}>Base Price</div>
                          <div style={{ fontWeight: 'bold' }}>${priceData.basePrice.toFixed(2)}</div>
                        </div>
                        <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#666' }}>Slot Count</div>
                          <div style={{ fontWeight: 'bold' }}>{priceData.slotCount} slots</div>
                        </div>
                        <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#666' }}>Multiplier</div>
                          <div style={{ fontWeight: 'bold' }}>{priceData.multiplier.toFixed(1)}x</div>
                        </div>
                      </div>
                      
                      <details style={{ marginTop: '16px' }}>
                        <summary style={{ cursor: 'pointer', color: '#1976d2' }}>View detailed breakdown</summary>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '12px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          marginTop: '8px',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {priceData.breakdown}
                        </pre>
                      </details>
                    </div>
                  )}
                  
                  {!isCalculatingPrice && !priceError && !priceData && (
                    <div style={{ textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                      Configure your section to see pricing
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!priceData || isCalculatingPrice}
                >
                  {isCalculatingPrice ? 'Calculating...' : 'Create Section'}
                </button>
                <button type="button" onClick={closeModal} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionsPage;