import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { SlotInfo, ShelfInfo } from '../../types/inventory';
import './sectiondetail.css';

interface SectionInfo {
  id: string;
  name: string;
  totalSlots: number;
  usedSlots: number;
}

const SectionDetail: React.FC = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [shelves, setShelves] = useState<ShelfInfo[]>([]);
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch section info
        const sections = await inventoryService.getSectionInfo();
        const currentSection = sections.find((s: any) => s.id === sectionId);
        
        if (currentSection) {
          setSectionInfo({
            id: currentSection.id,
            name: currentSection.name,
            totalSlots: currentSection.totalSlots,
            usedSlots: currentSection.usedSlots
          });
        }
        
        // Fetch section children (shelves or slots)
        const data = await inventoryService.getSectionChildren(sectionId!);
        if (data.length > 0 && 'slotsPerShelf' in data[0]) {
          setShelves(data as ShelfInfo[]);
        } else {
          setSlots(data as SlotInfo[]);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load section details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectionData();
  }, [sectionId]);

  const getGridDimensions = () => {
    const maxX = Math.max(...slots.map(s => s.x), 0);
    const maxY = Math.max(...slots.map(s => s.y), 0);
    return { cols: maxX + 1, rows: maxY + 1 };
  };

  const { cols } = getGridDimensions();

  const handleShelfClick = (shelfId: string) => {
    navigate(`/shelves/${shelfId}`);
  };
  
  const handleBackClick = () => {
    navigate('/sections');
  };

  const calcUtilization = () => {
    if (sectionInfo) {
      return sectionInfo.totalSlots > 0 
        ? Math.round((sectionInfo.usedSlots / sectionInfo.totalSlots) * 100) 
        : 0;
    }
    return 0;
  };

  return (
    <div className="section-detail-wrapper">
      <main className="section-detail-main">
        <div className="section-header">
          <h1 className="section-title">
            {sectionInfo ? sectionInfo.name : 'Section Details'}
          </h1>
          <button className="back-button" onClick={handleBackClick}>
            ← Back to Sections
          </button>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="content-container">
            {sectionInfo && (
              <div className="section-stats">
                <div className="stat-card">
                  <div className="stat-label">Total Slots</div>
                  <div className="stat-value">{sectionInfo.totalSlots}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Used Slots</div>
                  <div className="stat-value">{sectionInfo.usedSlots}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Utilization</div>
                  <div className="stat-value">{calcUtilization()}%</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Shelves</div>
                  <div className="stat-value">{shelves.length}</div>
                </div>
              </div>
            )}

            {shelves.length > 0 ? (
              <div className="shelves-container">
                <div className="shelves-header">
                  <h2 className="shelves-title">Shelves</h2>
                </div>
                <div className="shelves-list">
                  {shelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      className="shelf-box clickable"
                      onClick={() => handleShelfClick(shelf.id)}
                    >
                      <div className="shelf-id">Shelf {shelf.id.slice(-6)}</div>
                      <div className="shelf-dimensions">
                        Dimensions: {shelf.width} × {shelf.height}
                      </div>
                      <div className="shelf-slots">
                        <span>Slots: {shelf.slotsPerShelf}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : slots.length > 0 ? (
              <div className="slots-container">
                <div className="slots-header">
                  <h2 className="slots-title">Slots Layout</h2>
                </div>
                <div
                  className="slot-grid"
                  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`slot-box ${slot.occupied ? 'occupied' : ''}`}
                      style={{ gridColumnStart: slot.x + 1, gridRowStart: slot.y + 1 }}
                    >
                      <span className="slot-coords">({slot.x}, {slot.y})</span>
                      <span className="slot-status">
                        {slot.occupied ? 'Occupied' : 'Empty'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                No shelves or slots found in this section.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SectionDetail;