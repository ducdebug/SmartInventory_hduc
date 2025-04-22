import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { SlotInfo, ProductResponse } from '../../types/inventory';
import './shelfdetail.css';

const ShelfDetail: React.FC = () => {
  const { shelfId } = useParams<{ shelfId: string }>();
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchShelfSlots = async () => {
      try {
        const data = await inventoryService.getSlotsByShelf(shelfId!);
        setSlots(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load shelf slots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShelfSlots();
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
      alert('Error loading product info.');
    }
  };

  return (
    <div className="shelf-detail-wrapper">
      <main className="shelf-detail-main">
        <h2 className="text-xl font-bold mb-4">Shelf Layout</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="shelf-table">
            <div
              className="shelf-slots"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: '6px'
              }}
            >
              {slots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`shelf-slot ${slot.occupied ? 'occupied' : ''}`}
                  style={{
                    gridColumnStart: slot.y + 1,
                    gridRowStart: slot.x + 1,
                    border: '1px solid black',
                    padding: '10px',
                    textAlign: 'center',
                    cursor: slot.occupied ? 'pointer' : 'default'
                  }}
                  onClick={() => handleSlotClick(slot)}
                >
                  ({slot.x}, {slot.y})
                </div>
              ))}
            </div>

            <div className="shelf-legs" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <div className="leg" style={{ width: '30px', height: '30px', backgroundColor: '#333' }} />
              <div className="leg" style={{ width: '30px', height: '30px', backgroundColor: '#333' }} />
            </div>
          </div>
        )}
      </main>

      {showModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-2">{selectedProduct.name}</h3>
            <p className="text-sm text-gray-600 mb-4">Type: {selectedProduct.productType}</p>
            <div className="modal-details space-y-1">
              {Object.entries(selectedProduct.detail).map(([key, value]) => {
                if (['dispatch', 'slotShelf', 'slotSection', 'lot', 'price'].includes(key)) return null;
                return (
                  <div key={key}>
                    <strong className="capitalize">{key}:</strong> {String(value)}
                  </div>
                );
              })}

            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-3 py-1 bg-blue-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShelfDetail;
