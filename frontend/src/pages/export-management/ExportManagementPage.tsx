import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import inventoryService from '../../services/inventoryService';
import './exportmanagementpage.css';

interface LotItem {
  productName: string;
  quantity: number;
  importDate: string;
  price?: number;
  currency?: string;
}

interface Lot {
  id: string;
  username: string;
  importDate: string;
  storageStrategy: string;
  accepted: boolean;
  items: LotItem[];
}

const ExportManagementPage: React.FC = () => {
  const [pendingLots, setPendingLots] = useState<Lot[]>([]);
  const [acceptedLots, setAcceptedLots] = useState<Lot[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('Only administrators can access this page');
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [pendingData, acceptedData] = await Promise.all([
          inventoryService.getPendingLots(),
          inventoryService.getAcceptedLots()
        ]);
        setPendingLots(pendingData);
        setAcceptedLots(acceptedData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch export data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAcceptLot = async (lotId: string) => {
    try {
      await inventoryService.acceptLot(lotId);
      // Refresh the data
      const [pendingData, acceptedData] = await Promise.all([
        inventoryService.getPendingLots(),
        inventoryService.getAcceptedLots()
      ]);
      setPendingLots(pendingData);
      setAcceptedLots(acceptedData);
      alert('Export request accepted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to accept export request');
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
          Pending Requests
          {pendingLots.length > 0 && <span className="tab-badge">{pendingLots.length}</span>}
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Export History
        </button>
      </div>
      
      <div className="lots-container">
        {activeTab === 'pending' ? (
          pendingLots.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M12 9V15M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No pending export requests</p>
            </div>
          ) : (
            pendingLots.map(lot => (
              <div key={lot.id} className="lot-card">
                <div className="lot-header">
                  <div className="lot-info">
                    <h3>Request by: {lot.username}</h3>
                    <p className="lot-date">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 2V4M8 2V4M3 10H21M8 15H10M14 15H16M8 19H10M14 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {new Date(lot.importDate).toLocaleDateString()}
                    </p>
                    <span className="status pending">Pending</span>
                  </div>
                  <button 
                    className="accept-button"
                    onClick={() => handleAcceptLot(lot.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Accept & Process
                  </button>
                </div>
                
                <div className="lot-items">
                  <h4>Items:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lot.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )
        ) : (
          acceptedLots.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L14 14M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No export history available</p>
            </div>
          ) : (
            acceptedLots.map(lot => (
              <div key={lot.id} className="lot-card">
                <div className="lot-header">
                  <div className="lot-info">
                    <h3>Exported by: {lot.username}</h3>
                    <p className="lot-date">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 2V4M8 2V4M3 10H21M8 15H10M14 15H16M8 19H10M14 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {new Date(lot.importDate).toLocaleDateString()}
                    </p>
                    <span className="status completed">Completed</span>
                  </div>
                </div>
                
                <div className="lot-items">
                  <h4>Items:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lot.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default ExportManagementPage;