import React, { useEffect, useState } from 'react';
import inventoryService from '../../services/inventoryService';
import './lothistorypage.css';
import { Lot } from '../../types/inventory';

const LotHistoryPage: React.FC = () => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setIsLoading(true);
        const data = await inventoryService.getLotHistory();
        setLots(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch lot history');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLots();
  }, []);

  return (
    <div className="lot-history-container">
      <h2 className="lot-history-title">Lot History</h2>

      {isLoading ? (
        <div className="loading-spinner" role="status" aria-label="Loading" />
      ) : error ? (
        <div className="error-message" role="alert">{error}</div>
      ) : lots.length === 0 ? (
        <p className="no-lots">No lot history available.</p>
      ) : (
        <div className="lot-list">
          {lots.map((lot, index) => (
            <div key={index} className="lot-card">
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
              <h4 className="lot-items-title">Items:</h4>
              <ul className="lot-items">
                {lot.items.map((item, idx) => (
                  <li key={idx}>
                    {item.productName} - <strong>Qty:</strong> {item.quantity},{' '}
                    <strong>Price:</strong> {item.price?.value ?? 'N/A'}{' '}
                    {item.price?.currency ?? ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LotHistoryPage;