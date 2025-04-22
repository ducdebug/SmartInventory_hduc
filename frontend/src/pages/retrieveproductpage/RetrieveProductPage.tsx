import React, { useEffect, useState } from 'react';
import inventoryService from '../../services/inventoryService';
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

  useEffect(() => {
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
  }, []);

  const handleExportChange = (idx: number, value: number) => {
    const updated = [...summaries];
    updated[idx].exportQuantity = Math.max(0, Math.min(value, updated[idx].count));
    setSummaries(updated);
  };

  const handleSubmitExport = async () => {
    const productsToExport = summaries
      .filter(p => p.exportQuantity && p.exportQuantity > 0)
      .map(p => ({
        productId: p.productId,
        name: p.name,
        detail: p.detail,
        quantity: p.exportQuantity!,
      }));

    if (productsToExport.length === 0) {
      alert('No products selected for export.');
      return;
    }

    try {
      await inventoryService.exportProducts({ products: productsToExport });
      alert('Export successful!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Export failed.');
    }
  };

  return (
    <div className="retrieve-container">
      <h2 className="retrieve-title">Retrieve Products</h2>

      {isLoading ? (
        <div className="loading-spinner" role="status" aria-label="Loading" />
      ) : error ? (
        <div className="error-message" role="alert">{error}</div>
      ) : summaries.length === 0 ? (
        <p className="no-products">No products available to retrieve.</p>
      ) : (
        <>
          {summaries.map((entry, idx) => (
            <div key={entry.productId} className="product-card">
              <div className="product-header">
                <p className="product-name">{entry.name}</p>
                <p className="product-count">
                  <strong>Count:</strong> {entry.count}
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
                  Quantity to export:
                  <input
                    type="number"
                    min={0}
                    max={entry.count}
                    value={entry.exportQuantity ?? ''}
                    onChange={e => handleExportChange(idx, parseInt(e.target.value) || 0)}
                    className="export-field"
                    aria-label={`Export quantity for ${entry.name}`}
                  />
                  <span className="export-max">(max {entry.count})</span>
                </label>
              </div>
            </div>
          ))}
          <div className="action-section">
            <button onClick={handleSubmitExport} className="export-btn">
              Export Selected Products
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RetrieveProductPage;