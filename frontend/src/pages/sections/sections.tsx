import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SectionInfoResponse } from '../../types/inventory';
import inventoryService from '../../services/inventoryService';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, X, Settings, DollarSign, CheckCircle, AlertCircle, Loader2, Eye, ArrowLeft, Sparkles, Filter, Warehouse, Power, PowerOff, RotateCcw } from 'lucide-react';
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterCondition, setFilterCondition] = useState<string>('');
  
  // Section management states
  const [isManagingSections, setIsManagingSections] = useState(false);
  const [isSectionActionLoading, setIsSectionActionLoading] = useState(false);
  const [actionConfirmation, setActionConfirmation] = useState<{
    show: boolean;
    sectionId: string;
    sectionName: string;
    action: 'terminate' | 'activate';
  }>({ show: false, sectionId: '', sectionName: '', action: 'terminate' });

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

  useEffect(() => {
    if (isModalOpen && formData.y_slot > 0) {
      const activeConditions = formData.storageConditions
        .filter(cond => cond.conditionType)
        .map(cond => cond.conditionType);

      let totalSlots;
      if (formData.shelf_height && Number(formData.shelf_height) > 0) {
        totalSlots = formData.y_slot * Number(formData.shelf_height) * 6;
      } else {
        totalSlots = 6 * formData.y_slot;
      }

      calculatePrice(totalSlots, activeConditions);
    }
  }, [formData.y_slot, formData.shelf_height, formData.storageConditions, isModalOpen]);

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
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowConfirmation(false);
    setPriceData(null);
    setPriceError(null);
  };

  const conditionUnits: { [key: string]: string } = {
    'TEMPERATURE_CONTROLLED': '°C',
    'HUMIDITY_CONTROLLED': '%',
    'HAZARDOUS_MATERIALS': ''
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

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        y_slot: Number(formData.y_slot),
        shelf_height: formData.shelf_height ? Number(formData.shelf_height) : undefined,
        calculatedPrice: priceData.finalPrice,
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

  const handleSectionAction = (sectionId: string, sectionName: string, action: 'terminate' | 'activate') => {
    setActionConfirmation({
      show: true,
      sectionId,
      sectionName,
      action
    });
  };

  const confirmSectionAction = async () => {
    try {
      setIsSectionActionLoading(true);
      
      if (actionConfirmation.action === 'terminate') {
        await inventoryService.terminateSection(actionConfirmation.sectionId);
      } else {
        await inventoryService.activateSection(actionConfirmation.sectionId);
      }
      
      // Refresh sections after action
      await fetchSections();
      
      setActionConfirmation({ show: false, sectionId: '', sectionName: '', action: 'terminate' });
    } catch (error: any) {
      console.error(`Error ${actionConfirmation.action}ing section:`, error);
      
      // Extract error message from response (ErrorResponse structure)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${actionConfirmation.action} section`;
      
      // Show specific alert for occupied slots during termination
      if (actionConfirmation.action === 'terminate' && 
          (errorMessage.toLowerCase().includes('occupied slots') || 
           errorMessage.toLowerCase().includes('relocate items') ||
           errorMessage.toLowerCase().includes('cannot terminate'))) {
        alert(`❌ Cannot Terminate Section\n\nSection "${actionConfirmation.sectionName}" has occupied slots and cannot be terminated.\n\nPlease relocate all items from this section before attempting to terminate it.`);
        // Close the confirmation modal after showing the alert
        setActionConfirmation({ show: false, sectionId: '', sectionName: '', action: 'terminate' });
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSectionActionLoading(false);
    }
  };

  const cancelSectionAction = () => {
    setActionConfirmation({ show: false, sectionId: '', sectionName: '', action: 'terminate' });
  };

  const filteredSections = filterCondition
    ? sections.filter(section =>
        section.storageConditions.some(cond => cond.conditionType === filterCondition)
      )
    : sections;

  const totalSections = sections.length;
  const totalSlots = sections.reduce((acc, section) => acc + section.totalSlots, 0);
  const usedSlots = sections.reduce((acc, section) => acc + section.usedSlots, 0);

  return (
    <div className="sections-wrapper">
      <div className="sections-container">
        <header className="sections-header">
          <div className="header-content">
            <div className="header-title-section">
              <div className="header-icon-wrapper">
                <Warehouse className="header-main-icon" size={32} />
              </div>
              <div className="header-text">
                <h1 className="sections-title">Warehouse Management</h1>
                <p className="sections-subtitle">Monitor and manage your storage sections</p>
              </div>
            </div>

            <div className="header-stats">
              <div className="stat-card">
                <div className="stat-value">{totalSections}</div>
                <div className="stat-label">Sections</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{usedSlots}/{totalSlots}</div>
                <div className="stat-label">Slots Used</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0}%</div>
                <div className="stat-label">Utilization</div>
              </div>
            </div>
          </div>

          <div className="sections-controls">
            <div className="filter-control">
              <Filter size={18} className="filter-icon" />
              <select
                value={filterCondition}
                onChange={handleFilterChange}
                className="filter-dropdown"
                aria-label="Filter by condition"
              >
                <option value="">All Conditions</option>
                <option value="TEMPERATURE_CONTROLLED">🌡️ Temperature Controlled</option>
                <option value="HUMIDITY_CONTROLLED">💧 Humidity Controlled</option>
                <option value="HAZARDOUS_MATERIALS">⚠️ Hazardous Materials</option>
              </select>
            </div>

            <div className="management-controls">
              <button 
                onClick={() => setIsManagingSections(!isManagingSections)}
                className={`manage-sections-btn ${isManagingSections ? 'active' : ''}`}
                aria-label="Toggle section management mode"
              >
                <Settings size={18} />
                {isManagingSections ? 'Exit Management' : 'Manage Sections'}
              </button>

              <button onClick={openModal} className="create-btn" aria-label="Create New Section">
                <Plus size={18} />
                Create Section
              </button>
            </div>
          </div>
        </header>

        <main className="sections-main" aria-label="Warehouse Layout">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <div className="loading-text">
                <div className="loading-title">Loading warehouse layout...</div>
                <div className="loading-subtitle">Please wait while we fetch your sections</div>
              </div>
            </div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle className="error-icon" size={48} />
              <div className="error-content">
                <div className="error-title">Unable to load sections</div>
                <div className="error-message">{error}</div>
                <button onClick={fetchSections} className="retry-btn">
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Package size={64} />
              </div>
              <div className="empty-content">
                <h3 className="empty-title">
                  {filterCondition ? 'No matching sections found' : 'No sections created yet'}
                </h3>
                <p className="empty-description">
                  {filterCondition
                    ? 'Try adjusting your filter or create a new section with the selected conditions.'
                    : 'Get started by creating your first warehouse section to begin organizing your inventory.'
                  }
                </p>
                {!filterCondition && (
                  <button onClick={openModal} className="empty-action-btn">
                    <Plus size={18} />
                    Create Your First Section
                  </button>
                )}
              </div>
            </div>
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
                          <div className="section-card-wrapper">
                            <button
                              className={`section-card ${(section.status || 'ACTIVE') === 'TERMINATED' ? 'terminated' : ''}`}
                              onClick={() => !isManagingSections && handleSectionClick(section.id)}
                              aria-label={`Section ${section.name}`}
                              disabled={isManagingSections}
                            >
                              <div className="section-header">
                                <div className="section-title-row">
                                  <div className="section-name-status">
                                    <h3 className="section-name">{section.name}</h3>
                                    <div className={`section-status-badge ${(section.status || 'ACTIVE').toLowerCase()}`}>
                                      {(section.status || 'ACTIVE') === 'ACTIVE' ? (
                                        <>
                                          <Power size={12} />
                                          Active
                                        </>
                                      ) : (
                                        <>
                                          <PowerOff size={12} />
                                          Terminated
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="section-utilization">
                                    <div className="utilization-bar">
                                      <div
                                        className="utilization-fill"
                                        style={{
                                          width: `${Math.min((section.usedSlots / section.totalSlots) * 100, 100)}%`
                                        }}
                                      />
                                    </div>
                                    <span className="utilization-text">
                                      {section.usedSlots}/{section.totalSlots} slots
                                    </span>
                                  </div>
                                </div>

                                {section.priceInfo ? (
                                  <div className="price-badge">
                                    <DollarSign size={14} className="price-icon" />
                                    <div className="price-content">
                                      <span className="price-amount">
                                        ${section.priceInfo.monthlyPrice.toFixed(2)}/mo
                                      </span>
                                      <span className="price-per-slot">
                                        ${section.priceInfo.pricePerSlot.toFixed(2)} per slot
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="price-badge no-price">
                                    <AlertCircle size={14} className="price-icon" />
                                    <div className="price-content">
                                      <span className="price-amount">No pricing set</span>
                                      <span className="price-per-slot">Contact administrator</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="section-body">
                                <div className="section-info">
                                  <div className="info-item">
                                    <span className="info-label">Shelves</span>
                                    <span className="info-value">
                                      {section.numShelves > 0 ? section.numShelves : 'None'}
                                    </span>
                                  </div>
                                </div>

                                {section.storageConditions.length > 0 && (
                                  <div className="conditions-section">
                                    <div className="conditions-header">
                                      <Sparkles size={14} />
                                      <span>Storage Conditions</span>
                                    </div>
                                    <div className="conditions-list">
                                      {section.storageConditions.slice(0, 3).map((cond: {
                                        conditionType: string;
                                        minValue?: number;
                                        maxValue?: number;
                                        unit?: string;
                                      }, idx: number) => (
                                        <div key={idx} className="condition-tag">
                                          <span className="condition-icon">
                                            {conditionIcons[cond.conditionType] || '🏷️'}
                                          </span>
                                          <span className="condition-text">
                                            {conditionLabels[cond.conditionType] || cond.conditionType.replace(/_/g, ' ')}
                                            {(cond.minValue !== undefined || cond.maxValue !== undefined) && (
                                              <span className="condition-range">
                                                {' '}({cond.minValue ?? ''}-{cond.maxValue ?? ''}{cond.unit || ''})
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                      {section.storageConditions.length > 3 && (
                                        <div className="condition-tag more">
                                          +{section.storageConditions.length - 3} more
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="section-footer">
                                <div className="click-hint">
                                  <Eye size={14} />
                                  View Details
                                </div>
                              </div>
                            </button>

                            {isManagingSections && (
                              <div className="section-management-actions">
                                {(section.status || 'ACTIVE') === 'ACTIVE' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSectionAction(section.id, section.name, 'terminate');
                                    }}
                                    className="section-action-btn terminate"
                                    aria-label={`Terminate section ${section.name}`}
                                    disabled={isSectionActionLoading}
                                  >
                                    <PowerOff size={16} />
                                    Terminate
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSectionAction(section.id, section.name, 'activate');
                                    }}
                                    className="section-action-btn activate"
                                    aria-label={`Activate section ${section.name}`}
                                    disabled={isSectionActionLoading}
                                  >
                                    <RotateCcw size={16} />
                                    Activate
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="empty-cell">
                            <div className="cell-coordinates">
                              {x}, {y}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </main>
      </div>

      {/* Enhanced Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal} aria-modal="true">
          <div className="enhanced-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <Package className="header-icon" />
                </div>
                <div className="modal-title-section">
                  <h2 className="modal-title">Create New Section</h2>
                  <p className="modal-subtitle">Set up a new warehouse storage section with custom conditions</p>
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

            <form onSubmit={e => { e.preventDefault(); handleCreateSection(); }} className="enhanced-modal-form">
              <div className="form-card">
                <div className="form-card-header">
                  <div className="form-card-icon">
                    <Settings size={20} />
                  </div>
                  <h3 className="form-card-title">Basic Information</h3>
                </div>
                <div className="form-card-content">
                  <div className="input-group">
                    <label htmlFor="name" className="input-label">
                      Section Name <span className="required-asterisk">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter a descriptive name for your section"
                      className="enhanced-input"
                    />
                  </div>

                  <div className="input-row">
                    <div className="input-group">
                      <label htmlFor="y_slot" className="input-label">
                        Length <span className="required-asterisk">*</span>
                      </label>
                      <input
                        id="y_slot"
                        type="number"
                        name="y_slot"
                        min={1}
                        value={formData.y_slot}
                        onChange={handleInputChange}
                        required
                        className="enhanced-input"
                      />
                      <div className="input-help">
                        {formData.shelf_height && Number(formData.shelf_height) > 0 
                          ? `With shelves: ${formData.y_slot} shelves × ${formData.shelf_height} levels × 6 = ${formData.y_slot * Number(formData.shelf_height) * 6} total slots`
                          : `Without shelves: ${formData.y_slot} × 6 = ${formData.y_slot * 6} total slots`
                        }
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="shelf_height" className="input-label">
                        Shelf Height (levels per shelf)
                      </label>
                      <input
                        id="shelf_height"
                        type="number"
                        name="shelf_height"
                        min={1}
                        value={formData.shelf_height}
                        onChange={handleInputChange}
                        placeholder="Enter shelf height"
                        className="enhanced-input"
                      />
                      <div className="input-help">
                        {formData.shelf_height && Number(formData.shelf_height) > 0
                          ? `With ${formData.shelf_height} levels: ${formData.y_slot} shelves × ${formData.shelf_height} × 6 = ${formData.y_slot * Number(formData.shelf_height) * 6} total slots`
                          : "Optional: Height of each shelf (number of vertical levels)"
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <div className="form-card-icon">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="form-card-title">Storage Conditions</h3>
                  <p className="form-card-subtitle">Define special environmental requirements for this section</p>
                </div>
                <div className="form-card-content">
                  <div className="conditions-list">
                    {formData.storageConditions.map((cond, idx) => (
                      <div key={idx} className="condition-card">
                        <div className="condition-card-header">
                          <div className="condition-number">{idx + 1}</div>
                          {formData.storageConditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCondition(idx)}
                              className="condition-remove-btn"
                              aria-label={`Remove condition ${idx + 1}`}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        <div className="condition-card-content">
                          <div className="condition-type-select">
                            <label className="input-label">Condition Type</label>
                            <select
                              value={cond.conditionType}
                              onChange={e => handleInputChange(e, idx, 'conditionType')}
                              className="enhanced-select"
                              aria-label={`Condition type ${idx + 1}`}
                            >
                              <option value="">Select a condition type</option>
                              {Object.entries(conditionLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {conditionIcons[value]} {label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {cond.conditionType && (
                            <div className="condition-values">
                              <div className="value-input-group">
                                <label className="input-label">Min Value</label>
                                <input
                                  type="number"
                                  placeholder="Minimum"
                                  value={cond.minValue}
                                  onChange={e => handleInputChange(e, idx, 'minValue')}
                                  className={`enhanced-input small ${cond.conditionType === 'HAZARDOUS_MATERIALS' ? 'disabled' : ''}`}
                                  aria-label={`Minimum value ${idx + 1}`}
                                  readOnly={cond.conditionType === 'HAZARDOUS_MATERIALS'}
                                />
                              </div>

                              <div className="value-input-group">
                                <label className="input-label">Max Value</label>
                                <input
                                  type="number"
                                  placeholder="Maximum"
                                  value={cond.maxValue}
                                  onChange={e => handleInputChange(e, idx, 'maxValue')}
                                  className={`enhanced-input small ${cond.conditionType === 'HAZARDOUS_MATERIALS' ? 'disabled' : ''}`}
                                  aria-label={`Maximum value ${idx + 1}`}
                                  readOnly={cond.conditionType === 'HAZARDOUS_MATERIALS'}
                                />
                              </div>

                              <div className="value-input-group">
                                <label className="input-label">Unit</label>
                                <input
                                  placeholder="Unit"
                                  value={cond.unit}
                                  onChange={e => handleInputChange(e, idx, 'unit')}
                                  className="enhanced-input small disabled"
                                  aria-label={`Unit ${idx + 1}`}
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
                    onClick={addCondition}
                    className="add-condition-btn"
                  >
                    <Plus size={18} />
                    Add Another Condition
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
                  <p className="form-card-subtitle">Monthly maintenance cost for this section</p>
                </div>
                <div className="form-card-content">
                  <div className="price-calculation-container">
                    {isCalculatingPrice && (
                      <div className="price-loading">
                        <Loader2 className="price-spinner" size={24} />
                        <div className="price-loading-text">
                          <div className="loading-title">Calculating maintenance cost...</div>
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
                            <div className="breakdown-label">Total Slots</div>
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

                    {!isCalculatingPrice && !priceError && !priceData && (
                      <div className="price-placeholder">
                        <div className="placeholder-icon">💰</div>
                        <div className="placeholder-text">
                          <div className="placeholder-title">Cost calculation ready</div>
                          <div className="placeholder-subtitle">Configure your section settings above to see maintenance cost estimates</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="enhanced-modal-actions">
                {showConfirmation && priceData ? (
                  <div className="confirmation-section">
                    <div className="confirmation-card">
                      <div className="confirmation-header">
                        <CheckCircle className="confirmation-icon" size={28} />
                        <div className="confirmation-content">
                          <h4 className="confirmation-title">Confirm Section Creation</h4>
                          <p className="confirmation-text">
                            You are about to create section "<strong>{formData.name}</strong>" with a monthly maintenance cost of:
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
                        This cost will be charged monthly for section maintenance and cannot be changed after creation.
                      </div>
                    </div>

                    <div className="confirmation-actions">
                      <button
                        type="button"
                        onClick={handleCreateSection}
                        className="confirm-create-btn"
                      >
                        <CheckCircle size={18} />
                        Yes, Create Section
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
                      disabled={!priceData || isCalculatingPrice || !formData.name.trim()}
                      title={
                        !formData.name.trim() ? 'Please enter a section name' :
                        isCalculatingPrice ? 'Please wait for price calculation' :
                        !priceData ? 'Price calculation required before creating section' :
                        `Review and confirm section creation with monthly cost of $${priceData.finalPrice.toFixed(2)}`
                      }
                    >
                      {isCalculatingPrice ? (
                        <>
                          <Loader2 className="btn-spinner" size={18} />
                          Calculating Cost...
                        </>
                      ) : priceData ? (
                        <>
                          <Eye size={18} />
                          Review & Create (${priceData.finalPrice.toFixed(2)}/month)
                        </>
                      ) : (
                        <>
                          <DollarSign size={18} />
                          Calculate Price First
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
      )}

      {/* Section Management Confirmation Modal */}
      {actionConfirmation.show && (
        <div className="modal-overlay" onClick={cancelSectionAction} aria-modal="true">
          <div className="confirmation-modal-content" onClick={e => e.stopPropagation()}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                {actionConfirmation.action === 'terminate' ? (
                  <PowerOff className="terminate-icon" size={32} />
                ) : (
                  <RotateCcw className="activate-icon" size={32} />
                )}
              </div>
              <div className="confirmation-modal-title">
                <h3>
                  {actionConfirmation.action === 'terminate' ? 'Terminate Section' : 'Activate Section'}
                </h3>
                <p>
                  Are you sure you want to {actionConfirmation.action} section "{actionConfirmation.sectionName}"?
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={cancelSectionAction}
                aria-label="Close confirmation"
              >
                <X size={24} />
              </button>
            </div>

            <div className="confirmation-modal-body">
              {actionConfirmation.action === 'terminate' ? (
                <div className="warning-content">
                  <AlertCircle className="warning-icon" size={20} />
                  <div className="warning-text">
                    <strong>Warning:</strong> Terminating this section will:
                    <ul>
                      <li>Make it unavailable for new inventory storage</li>
                      <li>Require relocation of any existing items before termination</li>
                      <li>Stop monthly maintenance billing</li>
                    </ul>
                    This action can be reversed by activating the section again.
                  </div>
                </div>
              ) : (
                <div className="info-content">
                  <CheckCircle className="info-icon" size={20} />
                  <div className="info-text">
                    Activating this section will:
                    <ul>
                      <li>Make it available for inventory storage</li>
                      <li>Resume monthly maintenance billing</li>
                      <li>Allow new items to be stored in this section</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="confirmation-modal-actions">
              <button
                onClick={confirmSectionAction}
                className={`confirm-action-btn ${actionConfirmation.action}`}
                disabled={isSectionActionLoading}
              >
                {isSectionActionLoading ? (
                  <>
                    <Loader2 className="btn-spinner" size={18} />
                    {actionConfirmation.action === 'terminate' ? 'Terminating...' : 'Activating...'}
                  </>
                ) : (
                  <>
                    {actionConfirmation.action === 'terminate' ? (
                      <PowerOff size={18} />
                    ) : (
                      <RotateCcw size={18} />
                    )}
                    {actionConfirmation.action === 'terminate' ? 'Yes, Terminate' : 'Yes, Activate'}
                  </>
                )}
              </button>
              <button
                onClick={cancelSectionAction}
                className="cancel-action-btn"
                disabled={isSectionActionLoading}
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionsPage;