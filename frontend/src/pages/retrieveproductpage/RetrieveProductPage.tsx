import React, { useEffect, useState } from 'react';
import inventoryService from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import './retrieveproductpage.css';
import { Modal, notification, Alert } from 'antd';

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
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [requestId, setRequestId] = useState<string | null>(null);
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
      notification.warning({
        message: 'Warning',
        description: 'No products selected for retrieval.',
        placement: 'topRight',
      });
      return;
    }

    const totalPrice = productsToRetrieve.reduce((sum, product) => {
      const price = product.detail.secondaryPrice;
      if (!price) {
        notification.error({
          message: 'Error',
          description: 'Request admin to set the price for all selected products.',
          placement: 'topRight',
        });
        return sum;
      }
      return sum + (price * product.quantity);
    }, 0);

    if (totalPrice === 0) return;

    Modal.confirm({
      title: 'Confirm Retrieval Request',
      content: (
        <div>
          <p>Total Price: {totalPrice.toLocaleString()} {productsToRetrieve[0].detail.secondaryCurrency}</p>
          <ul>
            {productsToRetrieve.map(product => (
              <li key={product.productId}>{product.name} - Quantity: {product.quantity}</li>
            ))}
          </ul>
        </div>
      ),
      onOk: async () => {
        try {
          setIsSubmitting(true);
          setError(null);
          const result = await inventoryService.createRetrieveRequest({ products: productsToRetrieve });
          setSubmitSuccess(true);
          if (result && typeof result === 'string') {
            setRequestId(result);
          }
          const resetSummaries = summaries.map(summary => ({
            ...summary,
            exportQuantity: undefined
          }));
          setSummaries(resetSummaries);
        } catch (err: any) {
          console.error('Retrieve request error:', err);
          if (err.response && err.response.status === 403) {
            setError('You do not have permission to create retrieve requests. Please check your account role.');
          } else if (err.message) {
            setError(`Failed to submit retrieval request: ${err.message}`);
          } else {
            setError('Failed to submit retrieval request. Please try again later.');
          }
          setSubmitSuccess(false);
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleResetForm = () => {
    setSubmitSuccess(false);
    setRequestId(null);
  };

  if (isLoading) {
    return <div className="retrieve-container">
      <h2 className="retrieve-title">Request Product Retrieval</h2>
      <div className="loading-spinner" role="status" aria-label="Loading" />
    </div>;
  }

  if (error) {
    return <div className="retrieve-container">
      <h2 className="retrieve-title">Request Product Retrieval</h2>
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: '20px' }}
      />
      <button 
        onClick={() => setError(null)} 
        className="try-again-btn"
      >
        Try Again
      </button>
    </div>;
  }

  if (submitSuccess) {
    return (
      <div className="retrieve-container">
        <h2 className="retrieve-title">Retrieval Request Submitted</h2>
        <Alert
          message="Success"
          description={
            <div>
              <p>Your product retrieval request has been submitted successfully!</p>
              <p className="request-id">Request ID: {requestId || 'Generated'}</p>
              <p>An administrator will review your request soon. You'll be notified when it's processed.</p>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <button 
          onClick={handleResetForm} 
          className="new-request-btn"
        >
          Create Another Request
        </button>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="retrieve-container">
        <h2 className="retrieve-title">Request Product Retrieval</h2>
        <Alert
          message="No Products"
          description="No products available to retrieve."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      </div>
    );
  }

  return (
    <div className="retrieve-container">
      <h2 className="retrieve-title">Request Product Retrieval</h2>
      
      <Alert
        message="Information"
        description="Your retrieval request will be reviewed by an administrator before being processed."
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />
      
      {summaries.map((entry, idx) => (
        <div key={entry.productId} className="product-card">
          <div className="product-header">
            <p className="product-name">{entry.name}</p>
            <p className="product-count">
              <strong>Available:</strong> {entry.count}
            </p>
          </div>
          <div className="product-detail">
            {Object.entries(entry.detail).map(([key, value]) => {
              if (key === 'primaryPrice' || key === 'secondaryPrice' || 
                  key === 'primaryCurrency' || key === 'secondaryCurrency') {
                return null;
              }
              return (
                <p key={key}>
                  <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                </p>
              );
            })}
            
            {entry.detail.secondaryPrice ? (
              <p className="product-price">
                <strong>Price:</strong> {entry.detail.secondaryPrice} {entry.detail.secondaryCurrency}
              </p>
            ) : (
              <p className="product-price">
                <strong>Price:</strong> Not set
              </p>
            )}
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
    </div>
  );
};

export default RetrieveProductPage;