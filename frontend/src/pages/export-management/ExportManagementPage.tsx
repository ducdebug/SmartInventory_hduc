import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import dispatchService, { Dispatch } from '../../services/dispatchService';
import './exportmanagementpage.css';

const ExportManagementPage: React.FC = () => {
  const [pendingDispatches, setPendingDispatches] = useState<Dispatch[]>([]);
  const [completedDispatches, setCompletedDispatches] = useState<Dispatch[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [rejectDispatchId, setRejectDispatchId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('Only administrators can access this page');
      setIsLoading(false);
      return;
    }
    
    fetchDispatchData();
  }, [user]);

  const fetchDispatchData = async () => {
    try {
      setIsLoading(true);
      const [pendingData, completedData] = await Promise.all([
        dispatchService.getPendingDispatches(),
        dispatchService.getCompletedDispatches()
      ]);
      setPendingDispatches(pendingData);
      setCompletedDispatches(completedData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dispatch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptDispatch = async (dispatchId: string) => {
    try {
      await dispatchService.acceptDispatch(dispatchId);
      fetchDispatchData();
      alert('Dispatch accepted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to accept dispatch');
    }
  };

  const handleRejectDispatch = async () => {
    if (!rejectDispatchId) return;
    
    try {
      await dispatchService.rejectDispatch(rejectDispatchId, rejectionReason);
      setRejectDispatchId(null);
      setRejectionReason('');
      fetchDispatchData();
      alert('Dispatch rejected successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to reject dispatch');
    }
  };

  const handleViewDetails = async (dispatch: Dispatch) => {
    try {
      console.log("Fetching details for dispatch:", dispatch.id);
      const detailedDispatch = await dispatchService.getDispatchDetails(dispatch.id);
      console.log("Detailed dispatch data:", detailedDispatch);
      
      if (!detailedDispatch.items || detailedDispatch.items.length === 0) {
        console.warn("No items found in the dispatch details!");
      }
      
      setSelectedDispatch(detailedDispatch);
    } catch (err) {
      console.error("Error fetching dispatch details:", err);
      alert("Failed to fetch dispatch details. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'ACCEPTED': return 'status-accepted';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="export-management-container">
      <h1 className="page-title">Export Management</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests ({pendingDispatches.length})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Accepted/Rejected ({completedDispatches.length})
        </button>
      </div>
      
      <div className="dispatches-container">
        {activeTab === 'pending' ? (
          pendingDispatches.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M12 9V15M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No pending export requests</p>
            </div>
          ) : (
            <div className="dispatch-list">
              {pendingDispatches.map(dispatch => (
                <div key={dispatch.id} className="dispatch-card">
                  <div className="dispatch-header">
                    <div className="dispatch-info">
                      <h3>Request #{dispatch.id.substring(0, 8)}</h3>
                      <p className="dispatch-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M16 2V4M8 2V4M3 10H21M8 15H10M14 15H16M8 19H10M14 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {formatDate(dispatch.createdAt)}
                      </p>
                      <span className={`status ${getStatusBadgeClass(dispatch.status)}`}>{dispatch.status}</span>
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="view-button"
                        onClick={() => handleViewDetails(dispatch)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        View Details
                      </button>
                      {dispatch.status === 'PENDING' && (
                        <>
                          <button 
                            className="accept-button"
                            onClick={() => handleAcceptDispatch(dispatch.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Accept
                          </button>
                          <button 
                            className="reject-button"
                            onClick={() => setRejectDispatchId(dispatch.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="dispatch-summary">
                    <p>{dispatch.totalItems} {dispatch.totalItems === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          completedDispatches.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L14 14M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No export history available</p>
            </div>
          ) : (
            <div className="dispatch-list">
              {completedDispatches.map(dispatch => (
                <div key={dispatch.id} className="dispatch-card">
                  <div className="dispatch-header">
                    <div className="dispatch-info">
                      <h3>Request #{dispatch.id.substring(0, 8)}</h3>
                      <p className="dispatch-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M16 2V4M8 2V4M3 10H21M8 15H10M14 15H16M8 19H10M14 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {formatDate(dispatch.createdAt)}
                      </p>
                      <span className={`status ${getStatusBadgeClass(dispatch.status)}`}>{dispatch.status}</span>
                    </div>
                    <button 
                      className="view-button"
                      onClick={() => handleViewDetails(dispatch)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      View Details
                    </button>
                  </div>
                  
                  <div className="dispatch-summary">
                    <p>{dispatch.totalItems} {dispatch.totalItems === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      
      {selectedDispatch && (
        <div className="dispatch-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Dispatch Details</h2>
              <button className="close-button" onClick={() => setSelectedDispatch(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-header">
                <div className="detail-id">
                  <strong>ID:</strong> {selectedDispatch.id}
                </div>
                <div className="detail-date">
                  <strong>Date:</strong> {formatDate(selectedDispatch.createdAt)}
                </div>
                <div className="detail-status">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${getStatusBadgeClass(selectedDispatch.status)}`}>
                    {selectedDispatch.status}
                  </span>
                </div>
              </div>
              
              <div className="dispatch-items">
                <h3>Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Lot Code</th>
                      <th>Expiration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedDispatch.items || selectedDispatch.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center' }}>No items found in this dispatch</td>
                      </tr>
                    ) : (
                      selectedDispatch.items.map(item => {
                        // Log item data to debug
                        console.log('Rendering item:', item);
                        
                        return (
                          <tr key={item.id}>
                            <td>{item.product?.name || (item.productId ? `Product #${item.productId.substring(0, 8)}` : 'N/A')}</td>
                            <td>{item.quantity}</td>
                            <td>{item.product?.lotCode || 'N/A'}</td>
                            <td>
                              {item.product?.expirationDate 
                                ? formatDate(item.product.expirationDate)
                                : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="modal-actions">
                <button className="close-modal-button" onClick={() => setSelectedDispatch(null)}>Close</button>
                {selectedDispatch.status === 'PENDING' && (
                  <>
                    <button 
                      className="accept-button"
                      onClick={() => {
                        handleAcceptDispatch(selectedDispatch.id);
                        setSelectedDispatch(null);
                      }}
                    >
                      Accept Dispatch
                    </button>
                    <button 
                      className="reject-button"
                      onClick={() => {
                        setRejectDispatchId(selectedDispatch.id);
                        setSelectedDispatch(null);
                      }}
                    >
                      Reject Dispatch
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
  {rejectDispatchId && (
        <div className="rejection-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Reject Dispatch</h2>
              <button className="close-button" onClick={() => setRejectDispatchId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Please provide a reason for rejecting this dispatch request:</p>
              <textarea
                className="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
              />
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setRejectDispatchId(null)}>Cancel</button>
                <button 
                  className="reject-confirm-button"
                  onClick={handleRejectDispatch}
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportManagementPage;