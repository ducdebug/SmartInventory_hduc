import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { SlotInfo, ShelfInfo } from '../../types/inventory';
import './sectiondetail.css';

const SectionDetail: React.FC = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [shelves, setShelves] = useState<ShelfInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionChildren = async () => {
      try {
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

    fetchSectionChildren();
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

  return (
    <div className="section-detail-wrapper">
      <main className="section-detail-main">
        <h2 className="text-xl font-bold mb-4">Section Details</h2>

        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : shelves.length > 0 ? (
          <div>
            <h3 className="font-semibold mb-2">Shelves</h3>
            <div className="shelves-list">
              {shelves.map((shelf) => (
                <div
                  key={shelf.id}
                  className="shelf-box clickable"
                  onClick={() => handleShelfClick(shelf.id)}
                >
                  <strong>Shelf {shelf.id}</strong><br />
                  {shelf.width} x {shelf.height} — {shelf.slotsPerShelf} slots
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold mb-2">Slots</h3>
            <div
              className="slot-grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {slots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`slot-box ${slot.occupied ? 'occupied' : ''}`}
                  style={{ gridColumnStart: slot.x + 1, gridRowStart: slot.y + 1 }}
                >
                  ({slot.x}, {slot.y})
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SectionDetail;