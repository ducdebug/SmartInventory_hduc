import React, { useEffect, useState, ReactElement } from 'react';
import { useAuth } from '../../hooks/useAuth';
import inventoryService from '../../services/inventoryService';
import { LotStatus } from '../../types/inventory';
import './SupplierLotHistory.css';

interface LotProduct {
  productId: string;
  productName: string;
  productType: string;
  details: Record<string, any>;
}

interface Lot {
  lotId: string;
  lotCode: string;
  importDate: string;
  importedByUser: string;
  status?: LotStatus;
  products: LotProduct[];
}

const SupplierLotHistory: React.FC = () => {
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<LotProduct | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchSupplierLots();
  }, []);

  const fetchSupplierLots = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getProductsByLotForSupplier();
      
      const supplierLots = data.filter((lot: Lot) => lot.importedByUser === user?.username);
      setLots(supplierLots);
    } catch (err) {
      console.error('Error fetching supplier lots:', err);
      setError('Failed to load lot history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = (status?: LotStatus) => {
    if (!status) return 'status-imported'; 
    switch (status) {
      case LotStatus.PENDING:
        return 'status-pending';
      case LotStatus.ACCEPTED:
        return 'status-accepted';
      case LotStatus.REJECTED:
        return 'status-rejected';
      default:
        return 'status-imported';
    }
  };

  const getStatusDisplay = (status?: LotStatus) => {
    if (!status) return 'IMPORTED';
    switch (status) {
      case LotStatus.PENDING:
        return 'PENDING APPROVAL';
      case LotStatus.ACCEPTED:
        return 'ACCEPTED';
      case LotStatus.REJECTED:
        return 'REJECTED';
      default:
        return 'UNKNOWN';
    }
  };

  const handleViewDetails = (product: LotProduct, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProduct(null);
  };

  const formatDetailValue = (key: string, value: any): string | ReactElement => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    // Special handling for ingredients
    if (key.toLowerCase() === 'ingredients' && Array.isArray(value)) {
      return (
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {value.map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
      );
    }
    
    // Special handling for dates
    if (key.toLowerCase().includes('date') && typeof value === 'string') {
      try {
        const date = new Date(value);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      } catch {
        return String(value);
      }
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const handleLotSelect = (lot: Lot) => {
    setSelectedLot(lot);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredLots = searchTerm
    ? lots.filter(lot =>
        lot.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.products.some(product =>
          product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productType.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : lots;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalProducts = (lot: Lot) => {
    return lot.products.length;
  };

  const getProductTypeStats = (lot: Lot) => {
    const typeCount = lot.products.reduce((acc, product) => {
      acc[product.productType] = (acc[product.productType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount).map(([type, count]) => `${type}: ${count}`).join(', ');
  };

  if (user?.role !== 'SUPPLIER') {
    return (
      <div className="supplier-lot-history-container">
        <div className="supplier-lot-history-error">
          This page is only accessible to users with the Supplier role.
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-lot-history-container">
      <div className="supplier-lot-history-header">
        <h1>Your Import History</h1>
        <div className="supplier-lot-history-controls">
          <input
            type="text"
            placeholder="Search by lot code or product name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="supplier-lot-history-loading">Loading your import history...</div>
      ) : error ? (
        <div className="supplier-lot-history-error">{error}</div>
      ) : filteredLots.length === 0 ? (
        <div className="supplier-lot-history-empty">
          {searchTerm ? (
            <p>No lots found matching your search criteria.</p>
          ) : (
            <p>You haven't imported any lots yet. Create a new batch to get started!</p>
          )}
        </div>
      ) : (
        <div className="supplier-lot-history-content">
          <div className="lot-list">
            {filteredLots.map(lot => (
                <div
                  key={lot.lotId}
                  className={`lot-card ${selectedLot?.lotId === lot.lotId ? 'selected' : ''}`}
                  onClick={() => handleLotSelect(lot)}
                >
                  <div className="lot-card-header">
                    <div className="lot-code">Lot: {lot.lotCode}</div>
                    <div className="lot-status-actions">
                      <span className={getStatusClass(lot.status)}>{getStatusDisplay(lot.status)}</span>
                    </div>
                  </div>
                  <div className="lot-card-body">
                    <div className="lot-date">
                      Imported: {formatDate(lot.importDate)}
                    </div>
                    <div className="lot-summary">
                      {getTotalProducts(lot)} {getTotalProducts(lot) === 1 ? 'product' : 'products'}
                    </div>
                    <div className="lot-types">
                      {getProductTypeStats(lot)}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {selectedLot && (
            <div className="lot-details">
              <h2>Lot Details</h2>
              <div className="lot-details-header">
                <div>
                  <strong>Lot Code:</strong> {selectedLot.lotCode}
                </div>
                <div>
                  <strong>Import Date:</strong> {formatDate(selectedLot.importDate)}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <span className={getStatusClass(selectedLot.status)}>{getStatusDisplay(selectedLot.status)}</span>
                </div>
                <div>
                  <strong>Total Products:</strong> {getTotalProducts(selectedLot)}
                </div>
              </div>

              <div className="lot-products">
                <h3>Products in this Lot</h3>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Type</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLot.products.map(product => (
                        <tr key={product.productId}>
                          <td className="product-name">{product.productName}</td>
                          <td>
                            <span className="product-type-badge">{product.productType}</span>
                          </td>
                          <td>
                            <button
                              className="details-btn"
                              onClick={(e) => handleViewDetails(product, e)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Details Modal */}
      {isDetailsModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content product-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="close-btn" onClick={closeDetailsModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="product-info-section">
                <h3>Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Product Name:</label>
                    <span>{selectedProduct.productName}</span>
                  </div>
                  <div className="info-item">
                    <label>Product Type:</label>
                    <span className="product-type-badge">{selectedProduct.productType}</span>
                  </div>
                </div>
              </div>

              {selectedProduct.details && Object.keys(selectedProduct.details).length > 0 && (
                <div className="additional-details-section">
                  <h3>Additional Details</h3>
                  <div className="details-grid">
                    {Object.entries(selectedProduct.details).map(([key, value]) => {
                      const formattedValue = formatDetailValue(key, value);
                      const isReactElement = typeof formattedValue === 'object' && formattedValue !== null;
                      
                      return (
                        <div key={key} className="detail-item">
                          <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
                          {isReactElement ? (
                            <div className="detail-value">{formattedValue}</div>
                          ) : (
                            <span className={typeof value === 'object' && !Array.isArray(value) ? 'detail-object' : 'detail-value'}>
                              {formattedValue}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!selectedProduct.details || Object.keys(selectedProduct.details).length === 0) && (
                <div className="no-details">
                  <p>No additional details available for this product.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierLotHistory;