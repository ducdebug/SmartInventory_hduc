import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import dispatchService, { Dispatch } from '../../services/dispatchService';
import './History.css';

const History: React.FC = () => {
  const { user } = useAuth();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchBuyerDispatches();
  }, []);

  const fetchBuyerDispatches = async () => {
    setIsLoading(true);
    try {
      const data = await dispatchService.getBuyerDispatches();
      setDispatches(data);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching dispatches:', err);
      // Check if it's a 403 error (no data) vs actual error
      if (err.response?.status === 403) {
        setError('You do not have permission to access dispatch history.');
      } else if (err.response?.status === 404 || (err.response?.data && Array.isArray(err.response.data) && err.response.data.length === 0)) {
        setError(null); // No error, just no data
        setDispatches([]); // Empty array
      } else {
        setError('Failed to load request history. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatchSelect = async (dispatch: Dispatch) => {
    try {
      const detailedDispatch = await dispatchService.getDispatchDetails(dispatch.id);
      setSelectedDispatch(detailedDispatch);
    } catch (err) {
      console.error("Error fetching dispatch details:", err);
      setError("Failed to fetch dispatch details. Please try again.");
    }
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const filteredDispatches = statusFilter 
    ? dispatches.filter(dispatch => dispatch.status === statusFilter)
    : dispatches;

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

  if (user?.role !== 'SUPPLIER') {
    return (
      <div className="history-container">
        <div className="history-error">
          This page is only accessible to users with the Supplier role.
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Your Retrieval Request History</h1>
        <div className="history-controls">
          <select 
            value={statusFilter} 
            onChange={handleStatusFilterChange}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="history-loading">Loading your retrieval request history...</div>
      ) : error ? (
        <div className="history-error">{error}</div>
      ) : filteredDispatches.length === 0 ? (
        <div className="history-empty">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="#9ca3af" strokeWidth="2" />
              <path d="M12 6V12L16 14" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No Retrieval Requests Yet</h3>
            <p>You haven't submitted any product retrieval requests yet.</p>
            <p>Visit the <strong>Product Catalog</strong> to browse available products and submit your first request!</p>
          </div>
        </div>
      ) : (
        <div className="history-content">
          <div className="dispatch-list">
            {filteredDispatches.map(dispatch => (
              <div 
                key={dispatch.id} 
                className={`dispatch-card ${selectedDispatch?.id === dispatch.id ? 'selected' : ''}`}
                onClick={() => handleDispatchSelect(dispatch)}
              >
                <div className="dispatch-card-header">
                  <div className="dispatch-id">Request #{dispatch.id.substring(0, 8)}</div>
                  <div className={`dispatch-status ${getStatusBadgeClass(dispatch.status)}`}>
                    {dispatch.status}
                  </div>
                </div>
                <div className="dispatch-card-body">
                  <div className="dispatch-date">
                    Requested: {formatDate(dispatch.createdAt)}
                  </div>
                <div className="dispatch-summary">
                    {dispatch.totalItems || 0} {(dispatch.totalItems || 0) === 1 ? 'item' : 'items'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedDispatch && (
            <div className="dispatch-details">
              <h2>Request Details</h2>
              <div className="dispatch-details-header">
                <div>
                  <strong>Request ID:</strong> {selectedDispatch.id}
                </div>
                <div>
                  <strong>Requested:</strong> {formatDate(selectedDispatch.createdAt)}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <span className={`status-badge ${getStatusBadgeClass(selectedDispatch.status)}`}>
                    {selectedDispatch.status}
                  </span> 
                </div>
              </div>
              
              <div className="dispatch-items">
                <h3>Requested Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Lot</th>
                      <th>Expiration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedDispatch.items || selectedDispatch.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center' }}>No items found in this request</td>
                      </tr>
                    ) : (
                      selectedDispatch.items.map(item => (
                        <tr key={item.id}>
                          <td>{item.product?.name || 'N/A'}</td>
                          <td>{item.quantity}</td>
                          <td>{item.product?.lotCode || 'N/A'}</td>
                          <td>
                            {item.product?.expirationDate 
                              ? formatDate(item.product.expirationDate)
                              : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;