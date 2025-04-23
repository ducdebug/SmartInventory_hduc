import React, { useEffect, useState } from 'react';
import inventoryService from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import './retrieveproductpage.css';

interface ProductSummary {
  productId: string;
  productType: string;
  name: string;
  detail: Record<string, any>;
  count: number;
  exportQuantity?: number;
}

const RetrieveProductPage: React.FC = () => {
  const [summaries, setSummaries] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.role !== 'BUYER') {
      setError('Only buyers can request product retrieval');
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await inventoryService.getAllProducts();
        setSummaries(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleExportChange = (idx: number, value: number) => {
    const updated = [...summaries];
    updated[idx].exportQuantity = Math.max(0, Math.min(value, updated[idx].count));
    setSummaries(updated);
  };

  const handleSubmitRetrieveRequest = async () => {
    const productsToRetrieve = summaries
      .filter(p => p.exportQuantity && p.exportQuantity > 0)
      .map(p => ({
        productId: p.productId,
        name: p.name,
        detail: p.detail,
        quantity: p.exportQuantity!,
      }));

    if (productsToRetrieve.length === 0) {
      alert('No products selected for retrieval.');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.createRetrieveRequest({ products: productsToRetrieve });
      alert('Retrieval request submitted successfully! Admin will review your request.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to submit retrieval request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="retrieve-container">
      <h2 className="retrieve-title">Request Product Retrieval</h2>

      {isLoading ? (
        <div className="loading-spinner" role="status" aria-label="Loading" />
      ) : error ? (
        <div className="error-message" role="alert">{error}</div>
      ) : summaries.length === 0 ? (
        <p className="no-products">No products available to retrieve.</p>
      ) : (
        <>
          <div className="info-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            <span>Your retrieval request will be reviewed by an administrator before being processed.</span>
          </div>
          
          {summaries.map((entry, idx) => (
            <div key={entry.productId} className="product-card">
              <div className="product-header">
                <p className="product-name">{entry.name}</p>
                <p className="product-count">
                  <strong>Available:</strong> {entry.count}
                </p>
              </div>
              <div className="product-detail">
                {Object.entries(entry.detail).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                  </p>
                ))}
              </div>
              <div className="export-input">
                <label className="export-label">
                  Quantity to request:
                  <input
                    type="number"
                    min={0}
                    max={entry.count}
                    value={entry.exportQuantity ?? ''}
                    onChange={e => handleExportChange(idx, parseInt(e.target.value) || 0)}
                    className="export-field"
                    aria-label={`Request quantity for ${entry.name}`}
                  />
                  <span className="export-max">(max {entry.count})</span>
                </label>
              </div>
            </div>
          ))}
          <div className="action-section">
            <button 
              onClick={handleSubmitRetrieveRequest} 
              className="export-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Retrieval Request'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RetrieveProductPage;