import React, { useEffect, useState } from 'react';
import inventoryService from '../../services/inventoryService';
import './lothistorypage.css';
import { Lot } from '../../types/inventory';
import { useAuth } from '../../hooks/useAuth';

interface LotDetailModalProps {
  lot: Lot | null;
  onClose: () => void;
  onAccept?: (lotId: string) => void;
  showAcceptButton: boolean;
}

const LotDetailModal: React.FC<LotDetailModalProps> = ({ lot, onClose, onAccept, showAcceptButton }) => {
  if (!lot) return null;

  return (
    <div className="lot-detail-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Lot Details</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="lot-info">
            <p><strong>Imported At:</strong> {new Date(lot.importDate).toLocaleString()}</p>
            <p><strong>Created By:</strong> {lot.username}</p>
            <p><strong>Storage Strategy:</strong> {lot.storageStrategy}</p>
            <p><strong>Status:</strong> {lot.accepted ? 'Accepted' : 'Pending'}</p>
          </div>
          <h4>Items:</h4>
          <div className="lot-items-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {lot.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {item.price ? `${item.price}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          {showAcceptButton && lot.id && !lot.accepted && (
            <button 
              className="accept-button" 
              onClick={() => onAccept && onAccept(lot.id)}
            >
              Accept Lot
            </button>
          )}
          <button className="cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const LotHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted'>('pending');
  const [pendingLots, setPendingLots] = useState<Lot[]>([]);
  const [acceptedLots, setAcceptedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setIsLoading(true);
        const pendingData = await inventoryService.getPendingLots();
        const acceptedData = await inventoryService.getAcceptedLots();
        setPendingLots(pendingData);
        setAcceptedLots(acceptedData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch lot data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLots();
  }, []);

  const handleAcceptLot = async (lotId: string) => {
    try {
      await inventoryService.acceptLot(lotId);
      // Refresh lots after acceptance
      const pendingData = await inventoryService.getPendingLots();
      const acceptedData = await inventoryService.getAcceptedLots();
      setPendingLots(pendingData);
      setAcceptedLots(acceptedData);
      setSelectedLot(null); // Close modal
    } catch (err) {
      console.error(err);
      alert('Failed to accept lot');
    }
  };

  const lotsToDisplay = activeTab === 'pending' ? pendingLots : acceptedLots;

  return (
    <div className="lot-history-container">
      <h2 className="lot-history-title">Lot Management</h2>

      <div className="lot-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval ({pendingLots.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Accepted Lots ({acceptedLots.length})
        </button>
      </div>

      {isLoading ? (
        <div className="loading-spinner" role="status" aria-label="Loading" />
      ) : error ? (
        <div className="error-message" role="alert">{error}</div>
      ) : lotsToDisplay.length === 0 ? (
        <p className="no-lots">No {activeTab} lots available.</p>
      ) : (
        <div className="lot-list">
          {lotsToDisplay.map((lot) => (
            <div key={lot.id} className="lot-card">
              <div className="lot-header">
                <p>
                  <strong>Imported At:</strong> {new Date(lot.importDate).toLocaleString()}
                </p>
                <p>
                  <strong>By User:</strong> {lot.username}
                </p>
              </div>
              <p className="lot-strategy">
                <strong>Storage Strategy:</strong> {lot.storageStrategy}
              </p>
              <p className="lot-status">
                <strong>Status:</strong> {lot.accepted ? 'Accepted' : 'Pending'}
              </p>
              <h4 className="lot-items-title">Items:</h4>
              <ul className="lot-items">
                {lot.items.slice(0, 3).map((item, idx) => (
                  <li key={idx}>
                    {item.productName} - <strong>Qty:</strong> {item.quantity}
                    {item.price && ` - Price: ${item.price}`}
                  </li>
                ))}
                {lot.items.length > 3 && <li>...and {lot.items.length - 3} more items</li>}
              </ul>
              <div className="lot-card-actions">
                <button 
                  className="view-details-button" 
                  onClick={() => setSelectedLot(lot)}
                >
                  View Details
                </button>
                {isAdmin && activeTab === 'pending' && !lot.accepted && (
                  <button 
                    className="accept-button" 
                    onClick={() => handleAcceptLot(lot.id)}
                  >
                    Accept
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLot && (
        <LotDetailModal 
          lot={selectedLot} 
          onClose={() => setSelectedLot(null)} 
          onAccept={handleAcceptLot}
          showAcceptButton={isAdmin && !selectedLot.accepted}
        />
      )}
    </div>
  );
};

export default LotHistoryPage;