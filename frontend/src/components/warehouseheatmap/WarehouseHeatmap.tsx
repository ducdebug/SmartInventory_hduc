import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import './WarehouseHeatmap.css';

interface SectionUtilization {
  id: string;
  name: string;
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  utilizationPercentage: number;
  storageConditions: {
    conditionType: string;
    minValue?: number;
    maxValue?: number;
    unit?: string;
  }[];
}

const WarehouseHeatmap: React.FC = () => {
  const [sections, setSections] = useState<SectionUtilization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Using existing getSectionInfo and transforming the data
        const data = await inventoryService.getSectionInfo();
        
        // Transform the data to match our expected format
        const transformedData = data.map((section: any) => ({
          id: section.id,
          name: section.name,
          totalSlots: section.totalSlots || 0,
          usedSlots: section.usedSlots || 0,
          availableSlots: (section.totalSlots || 0) - (section.usedSlots || 0),
          utilizationPercentage: section.totalSlots ? 
            (section.usedSlots / section.totalSlots) * 100 : 0,
          storageConditions: section.storageConditions || []
        }));
        
        setSections(transformedData);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load section utilization data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getColorForUtilization = (percentage: number): string => {
    // Color gradient from green (0%) to yellow (50%) to red (100%)
    if (percentage < 50) {
      // Green to yellow gradient
      const greenValue = 255 - Math.floor((percentage / 50) * 55);
      return `rgb(${255 - greenValue}, 255, 0)`;
    } else {
      // Yellow to red gradient
      const redValue = 255;
      const greenValue = Math.floor(255 - ((percentage - 50) / 50) * 255);
      return `rgb(${redValue}, ${greenValue}, 0)`;
    }
  };

  const handleSectionClick = (id: string) => {
    // Navigate to section detail
    window.location.href = `/sections/${id}`;
  };

  if (isLoading) {
    return <div className="heatmap-loading">Loading section data...</div>;
  }

  if (error) {
    return <div className="heatmap-error">{error}</div>;
  }

  return (
    <div className="warehouse-heatmap-container">
      <h2 className="heatmap-title">Warehouse Occupancy Heatmap</h2>
      
      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(200, 255, 0)' }}></div>
          <span>Low Occupancy (&lt;50%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(255, 255, 0)' }}></div>
          <span>Medium Occupancy (50%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(255, 128, 0)' }}></div>
          <span>High Occupancy (&gt;75%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(255, 0, 0)' }}></div>
          <span>Full Occupancy (100%)</span>
        </div>
      </div>
      
      <div className="warehouse-heatmap">
        {sections.map((section) => (
          <div 
            key={section.id}
            className="heatmap-section"
            style={{ 
              backgroundColor: getColorForUtilization(section.utilizationPercentage),
              // Make sections with more slots larger (proportional to log of slot count)
              width: `${Math.max(100, 100 + Math.log(section.totalSlots) * 20)}px`,
              height: `${Math.max(100, 100 + Math.log(section.totalSlots) * 15)}px`
            }}
            onClick={() => handleSectionClick(section.id)}
          >
            <div className="section-info">
              <div className="section-name">{section.name}</div>
              <div className="section-stats">
                <div className="utilization">
                  <strong>{Math.round(section.utilizationPercentage)}%</strong>
                </div>
                <div className="slot-count">
                  {section.usedSlots}/{section.totalSlots} slots
                </div>
              </div>
              {section.storageConditions.length > 0 && (
                <div className="storage-conditions">
                  {section.storageConditions.map((condition, index) => (
                    <span key={index} className="condition-badge">
                      {condition.conditionType.replace(/_/g, ' ')}
                    </span>
                  )).slice(0, 2)}
                  {section.storageConditions.length > 2 && (
                    <span className="condition-badge more">
                      +{section.storageConditions.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarehouseHeatmap;