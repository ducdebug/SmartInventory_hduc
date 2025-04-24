import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { SlotInfo, ProductResponse } from '../../types/inventory';
import './shelfdetail.css';

interface ShelfData {
  id: string;
  width: number;
  height: number;
  totalSlots: number;
  occupiedSlots: number;
}

const ShelfDetail: React.FC = () => {
  const { shelfId } = useParams<{ shelfId: string }>();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [shelfData, setShelfData] = useState<ShelfData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchShelfData = async () => {
      try {
        setIsLoading(true);
        const data = await inventoryService.getSlotsByShelf(shelfId!);
        setSlots(data);
        
        if (data.length > 0) {
          // Extract shelf data from the first slot's shelf info
          // This is a placeholder - in a real app, you would have a separate API call
          // to get shelf details
          const occupiedCount = data.filter((slot: SlotInfo) => slot.occupied).length;
          
          setShelfData({
            id: shelfId!,
            width: Math.max(...data.map((s: SlotInfo) => s.x)) + 1,
            height: Math.max(...data.map((s: SlotInfo) => s.y)) + 1,
            totalSlots: data.length,
            occupiedSlots: occupiedCount
          });
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load shelf slots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShelfData();
  }, [shelfId]);

  const getGridDimensions = () => {
    const maxX = Math.max(...slots.map(s => s.x), 0);
    const maxY = Math.max(...slots.map(s => s.y), 0);
    return { cols: maxY + 1, rows: maxX + 1 };
  };

  const { cols, rows } = getGridDimensions();

  const handleSlotClick = async (slot: SlotInfo) => {
    if (!slot.occupied) return;

    try {
      const product = await inventoryService.getProductBySlot(slot.id);
      setSelectedProduct(product);
      setShowModal(true);
    } catch (err) {
      console.error('Failed to load product info:', err);
      setError('Failed to load product details');
    }
  };
  
  const handleBackClick = () => {
    // Navigate back to the parent section
    // In a real app, you would store the parent section ID
    navigate('/sections');
  };
  
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  return (
    <div className="shelf-detail-wrapper">
      <main className="shelf-detail-main">
        <div className="shelf-header">
          <h1 className="shelf-title">
            Shelf Details - {shelfId && shelfId.slice(-6)}
          </h1>
          <button className="back-button" onClick={handleBackClick}>
            ← Back to Section
          </button>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {shelfData && (
              <div className="shelf-info-row">
                <div className="info-card">
                  <div className="info-label">Dimensions</div>
                  <div className="info-value">{shelfData.width} × {shelfData.height}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Total Slots</div>
                  <div className="info-value">{shelfData.totalSlots}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Occupied Slots</div>
                  <div className="info-value">{shelfData.occupiedSlots}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Utilization</div>
                  <div className="info-value">
                    {Math.round((shelfData.occupiedSlots / shelfData.totalSlots) * 100)}%
                  </div>
                </div>
              </div>
            )}

            <div className="shelf-layout-container">
              <h2>Shelf Layout</h2>
              
              <div className="shelf-table">
                <div
                  className="shelf-slots"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`
                  }}
                >
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`shelf-slot ${slot.occupied ? 'occupied' : ''}`}
                      style={{
                        gridColumnStart: slot.y + 1,
                        gridRowStart: slot.x + 1
                      }}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <span className="slot-coords">({slot.x}, {slot.y})</span>
                      <span className="slot-status">
                        {slot.occupied ? 'Occupied' : 'Empty'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="shelf-legs">
                  <div className="leg"></div>
                  <div className="leg"></div>
                </div>
              </div>
              
              <div className="shelf-legend">
                <div className="legend-item">
                  <div className="legend-color empty"></div>
                  <span>Empty Slot</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color occupied"></div>
                  <span>Occupied Slot</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedProduct.name}</h3>
                <span className="product-type">{selectedProduct.productType}</span>
              </div>
            </div>
            
            <div className="modal-details">
              {selectedProduct.detail && 
                Object.entries(selectedProduct.detail).map(([key, value]) => {
                  if (['dispatch', 'slotShelf', 'slotSection', 'lot', 'price'].includes(key)) {
                    return null;
                  }
                  return (
                    <div key={key} className="detail-item">
                      <div className="detail-label">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="detail-value">{formatValue(value)}</div>
                    </div>
                  );
                })
              }
            </div>
            
            <button className="close-button" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShelfDetail;
