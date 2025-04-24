import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SectionInfoResponse } from '../../types/inventory';
import inventoryService from '../../services/inventoryService';
import { useNavigate } from 'react-router-dom';
import './sections.css';

const SectionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionInfoResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCondition, setFilterCondition] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    y_slot: 1,
    shelf_height: '',
    storageConditions: [{ conditionType: '', minValue: '', maxValue: '', unit: '' }]
  });

  useEffect(() => {
    fetchSections();
  }, []);

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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const conditionUnits: { [key: string]: string } = {
    'TEMPERATURE_CONTROLLED': '°C',
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
    try {
      const payload = {
        name: formData.name.trim(),
        y_slot: Number(formData.y_slot),
        shelf_height: formData.shelf_height ? Number(formData.shelf_height) : undefined,
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
          <div className="warehouse-grid">
            {filteredSections.map(section => (
              <button
                key={section.id}
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
                      {section.storageConditions.map((cond, idx) => (
                        <li key={idx} className="condition-item">
                          <span className="condition-type">{cond.conditionType.replace(/_/g, ' ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal} aria-modal="true">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Section</h2>
            <form onSubmit={e => { e.preventDefault(); handleCreateSection(); }}>
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
                      disabled // Disable manual unit input
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

              <div className="modal-actions">
                <button type="submit" className="submit-btn">Create</button>
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