import React, { useEffect, useState } from 'react';
import inventoryService from '../../services/inventoryService';
import './lothistorypage.css';
import { Lot, LotStatus } from '../../types/inventory';
import { useAuth } from '../../hooks/useAuth';

interface LotDetailModalProps {
  lot: Lot | null;
  onClose: () => void;
  onAccept?: (lotId: string) => void;
  onAcceptWithdrawal?: (lotId: string) => void;
  onRejectWithdrawal?: (lotId: string) => void;
  showActionButtons: boolean;
}

const LotDetailModal: React.FC<LotDetailModalProps> = ({ 
  lot, 
  onClose, 
  onAccept, 
  onAcceptWithdrawal, 
  onRejectWithdrawal,
  showActionButtons 
}) => {
  if (!lot) return null;

  const getStatusDisplay = (status: LotStatus) => {
    switch (status) {
      case LotStatus.PENDING:
        return 'Pending Approval';
      case LotStatus.ACCEPTED:
        return 'Accepted';
      case LotStatus.REJECTED:
        return 'Rejected';
      case LotStatus.PEND_WITHDRAW:
        return 'Pending Withdrawal';
      case LotStatus.WITHDRAWN:
        return 'Withdrawn';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: LotStatus) => {
    switch (status) {
      case LotStatus.PENDING:
        return 'status-pending';
      case LotStatus.ACCEPTED:
        return 'status-accepted';
      case LotStatus.REJECTED:
        return 'status-rejected';
      case LotStatus.PEND_WITHDRAW:
        return 'status-pending-withdrawal';
      case LotStatus.WITHDRAWN:
        return 'status-withdrawn';
      default:
        return '';
    }
  };

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
            <p><strong>Status:</strong> <span className={getStatusClass(lot.status)}>{getStatusDisplay(lot.status)}</span></p>
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
                      {item.price ? `${item.price.value} ${item.price.currency}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          {showActionButtons && (
            <>
              {lot.status === LotStatus.PENDING && onAccept && (
                <button 
                  className="accept-button" 
                  onClick={() => onAccept(lot.id)}
                >
                  Accept Lot
                </button>
              )}
              {lot.status === LotStatus.PEND_WITHDRAW && onAcceptWithdrawal && (
                <button 
                  className="accept-withdrawal-button" 
                  onClick={() => onAcceptWithdrawal(lot.id)}
                >
                  Accept Withdrawal
                </button>
              )}
              {lot.status === LotStatus.PEND_WITHDRAW && onRejectWithdrawal && (
                <button 
                  className="reject-withdrawal-button" 
                  onClick={() => onRejectWithdrawal(lot.id)}
                >
                  Reject Withdrawal
                </button>
              )}
            </>
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
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected' | 'pending-withdrawal' | 'withdrawn'>('pending');
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isAdmin) {
        // Admin can see all lots with all statuses
        const allLotsData = await inventoryService.getAllLots();
        setAllLots(allLotsData);
      } else {
        // Non-admin users see limited view (backward compatibility)
        const pendingData = await inventoryService.getPendingLots();
        const acceptedData = await inventoryService.getAcceptedLots();
        setAllLots([...pendingData, ...acceptedData]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch lot data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptLot = async (lotId: string) => {
    setActionLoading(prev => new Set(prev).add(lotId));
    try {
      await inventoryService.acceptLot(lotId);
      await fetchLots(); // Refresh data
      setSelectedLot(null);
      alert('Lot accepted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to accept lot');
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(lotId);
        return newSet;
      });
    }
  };

  const handleAcceptWithdrawal = async (lotId: string) => {
    if (!window.confirm('Are you sure you want to accept this withdrawal? This will permanently remove all products from the lot.')) {
      return;
    }

    setActionLoading(prev => new Set(prev).add(lotId));
    try {
      await inventoryService.acceptWithdrawal(lotId);
      await fetchLots(); // Refresh data
      setSelectedLot(null);
      alert('Withdrawal accepted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to accept withdrawal');
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(lotId);
        return newSet;
      });
    }
  };

  const handleRejectWithdrawal = async (lotId: string) => {
    if (!window.confirm('Are you sure you want to reject this withdrawal? The lot will return to accepted status.')) {
      return;
    }

    setActionLoading(prev => new Set(prev).add(lotId));
    try {
      await inventoryService.rejectWithdrawal(lotId);
      await fetchLots(); // Refresh data
      setSelectedLot(null);
      alert('Withdrawal rejected successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to reject withdrawal');
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(lotId);
        return newSet;
      });
    }
  };

  const getLotsToDisplay = () => {
    return allLots.filter(lot => {
      switch (activeTab) {
        case 'pending':
          return lot.status === LotStatus.PENDING;
        case 'accepted':
          return lot.status === LotStatus.ACCEPTED;
        case 'rejected':
          return lot.status === LotStatus.REJECTED;
        case 'pending-withdrawal':
          return lot.status === LotStatus.PEND_WITHDRAW;
        case 'withdrawn':
          return lot.status === LotStatus.WITHDRAWN;
        default:
          return false;
      }
    });
  };

  const getLotCountByStatus = (status: LotStatus) => {
    return allLots.filter(lot => lot.status === status).length;
  };

  const lotsToDisplay = getLotsToDisplay();

  const getStatusDisplay = (status: LotStatus) => {
    switch (status) {
      case LotStatus.PENDING:
        return 'Pending Approval';
      case LotStatus.ACCEPTED:
        return 'Accepted';
      case LotStatus.REJECTED:
        return 'Rejected';
      case LotStatus.PEND_WITHDRAW:
        return 'Pending Withdrawal';
      case LotStatus.WITHDRAWN:
        return 'Withdrawn';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: LotStatus) => {
    switch (status) {
      case LotStatus.PENDING:
        return 'status-pending';
      case LotStatus.ACCEPTED:
        return 'status-accepted';
      case LotStatus.REJECTED:
        return 'status-rejected';
      case LotStatus.PEND_WITHDRAW:
        return 'status-pending-withdrawal';
      case LotStatus.WITHDRAWN:
        return 'status-withdrawn';
      default:
        return '';
    }
  };

  return (
    <div className="lot-history-container">
      <h2 className="lot-history-title">Lot Management</h2>

      <div className="lot-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval ({getLotCountByStatus(LotStatus.PENDING)})
        </button>
        <button 
          className={`tab-button ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Accepted Lots ({getLotCountByStatus(LotStatus.ACCEPTED)})
        </button>
        {isAdmin && (
          <>
            <button 
              className={`tab-button ${activeTab === 'pending-withdrawal' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending-withdrawal')}
            >
              Pending Withdrawal ({getLotCountByStatus(LotStatus.PEND_WITHDRAW)})
            </button>
            <button 
              className={`tab-button ${activeTab === 'withdrawn' ? 'active' : ''}`}
              onClick={() => setActiveTab('withdrawn')}
            >
              Withdrawn ({getLotCountByStatus(LotStatus.WITHDRAWN)})
            </button>
          </>
        )}
        <button 
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Lots ({getLotCountByStatus(LotStatus.REJECTED)})
        </button>
      </div>

      {isLoading ? (
        <div className="loading-spinner" role="status" aria-label="Loading" />
      ) : error ? (
        <div className="error-message" role="alert">{error}</div>
      ) : lotsToDisplay.length === 0 ? (
        <p className="no-lots">No {activeTab.replace('-', ' ')} lots available.</p>
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
                <strong>Status:</strong> <span className={getStatusClass(lot.status)}>{getStatusDisplay(lot.status)}</span>
              </p>
              <h4 className="lot-items-title">Items:</h4>
              <ul className="lot-items">
                {lot.items.slice(0, 3).map((item, idx) => (
                  <li key={idx}>
                    {item.productName} - <strong>Qty:</strong> {item.quantity}
                    {item.price && ` - Price: ${item.price.value} ${item.price.currency}`}
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
                {isAdmin && (
                  <>
                    {lot.status === LotStatus.PENDING && (
                      <button 
                        className="accept-button" 
                        onClick={() => handleAcceptLot(lot.id)}
                        disabled={actionLoading.has(lot.id)}
                      >
                        {actionLoading.has(lot.id) ? 'Processing...' : 'Accept'}
                      </button>
                    )}
                    {lot.status === LotStatus.PEND_WITHDRAW && (
                      <>
                        <button 
                          className="accept-withdrawal-button" 
                          onClick={() => handleAcceptWithdrawal(lot.id)}
                          disabled={actionLoading.has(lot.id)}
                        >
                          {actionLoading.has(lot.id) ? 'Processing...' : 'Accept Withdrawal'}
                        </button>
                        <button 
                          className="reject-withdrawal-button" 
                          onClick={() => handleRejectWithdrawal(lot.id)}
                          disabled={actionLoading.has(lot.id)}
                        >
                          {actionLoading.has(lot.id) ? 'Processing...' : 'Reject Withdrawal'}
                        </button>
                      </>
                    )}
                  </>
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
          onAcceptWithdrawal={handleAcceptWithdrawal}
          onRejectWithdrawal={handleRejectWithdrawal}
          showActionButtons={isAdmin}
        />
      )}
    </div>
  );
};

export default LotHistoryPage;