import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import inventoryService from '../../services/inventoryService';
import { LotStatus } from '../../types/inventory';
import './SupplierLotHistory.css';

interface LotProduct {
  productId: string;
  productName: string;
  productType: string;
  primaryPrice: {
    id: string;
    value: number;
    currency: string;
  };
  secondaryPrice?: {
    id: string;
    value: number;
    currency: string;
  };
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
  const [withdrawingLots, setWithdrawingLots] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSupplierLots();
  }, []);

  const fetchSupplierLots = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getProductsByLotForSupplier();
      
      // Show ALL lots imported by the current supplier (not just accepted ones)
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
    if (!status) return 'status-imported'; // Default fallback for backward compatibility
    switch (status) {
      case LotStatus.PENDING:
        return 'status-pending';
      case LotStatus.ACCEPTED:
        return 'status-accepted';
      case LotStatus.REJECTED:
        return 'status-rejected';
      case LotStatus.PEND_WITHDRAW:
        return 'status-pending';
      case LotStatus.WITHDRAWN:
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
      case LotStatus.PEND_WITHDRAW:
        return 'PENDING WITHDRAWAL';
      case LotStatus.WITHDRAWN:
        return 'WITHDRAWN';
      default:
        return 'UNKNOWN';
    }
  };

  const handleLotSelect = (lot: Lot) => {
    setSelectedLot(lot);
  };

  const handleWithdraw = async (lotId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent lot selection when clicking withdraw button
    
    if (withdrawingLots.has(lotId)) {
      return; // Already withdrawing
    }

    const lot = lots.find(l => l.lotId === lotId);
    if (!lot) return;

    const confirmMessage = lot.status === LotStatus.PENDING 
      ? 'Are you sure you want to withdraw this lot? This will permanently delete all products in this lot.'
      : 'Are you sure you want to request withdrawal for this lot? An admin will need to approve the withdrawal.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setWithdrawingLots(prev => new Set(prev).add(lotId));

    try {
      await inventoryService.withdrawLot(lotId);
      
      // Refresh the lots list
      await fetchSupplierLots();
      
      // If the withdrawn lot was selected, clear selection
      if (selectedLot?.lotId === lotId) {
        setSelectedLot(null);
      }
      
      // Show success message
      const successMessage = lot.status === LotStatus.PENDING
        ? 'Lot has been successfully withdrawn and deleted.'
        : 'Withdrawal request has been submitted and is pending admin approval.';
      
      alert(successMessage);
      
    } catch (err: any) {
      console.error('Error withdrawing lot:', err);
      const errorMessage = err.response?.data || 'Failed to withdraw lot. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setWithdrawingLots(prev => {
        const newSet = new Set(prev);
        newSet.delete(lotId);
        return newSet;
      });
    }
  };

  const canWithdraw = (status?: LotStatus) => {
    return status === LotStatus.PENDING || status === LotStatus.ACCEPTED;
  };

  const getWithdrawButtonText = (status?: LotStatus) => {
    if (status === LotStatus.PENDING) {
      return 'Delete Lot';
    } else if (status === LotStatus.ACCEPTED) {
      return 'Request Withdrawal';
    }
    return 'Withdraw';
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

  const getTotalValue = (lot: Lot) => {
    const total = lot.products.reduce((sum, product) => {
      const price = product.secondaryPrice || product.primaryPrice;
      return sum + (price?.value || 0);
    }, 0);
    const currency = lot.products[0]?.primaryPrice?.currency || 'VND';
    return { value: total, currency };
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
            {filteredLots.map(lot => {
              const totalValue = getTotalValue(lot);
              return (
                <div
                  key={lot.lotId}
                  className={`lot-card ${selectedLot?.lotId === lot.lotId ? 'selected' : ''}`}
                  onClick={() => handleLotSelect(lot)}
                >
                  <div className="lot-card-header">
                    <div className="lot-code">Lot: {lot.lotCode}</div>
                    <div className="lot-status-actions">
                      <span className={getStatusClass(lot.status)}>{getStatusDisplay(lot.status)}</span>
                      {canWithdraw(lot.status) && (
                        <button
                          className={`withdraw-btn ${lot.status === LotStatus.PENDING ? 'withdraw-btn-delete' : 'withdraw-btn-request'}`}
                          onClick={(e) => handleWithdraw(lot.lotId, e)}
                          disabled={withdrawingLots.has(lot.lotId)}
                        >
                          {withdrawingLots.has(lot.lotId) ? 'Processing...' : getWithdrawButtonText(lot.status)}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="lot-card-body">
                    <div className="lot-date">
                      Imported: {formatDate(lot.importDate)}
                    </div>
                    <div className="lot-summary">
                      {getTotalProducts(lot)} {getTotalProducts(lot) === 1 ? 'product' : 'products'}
                    </div>
                    <div className="lot-value">
                      Total Value: {totalValue.value.toLocaleString()} {totalValue.currency}
                    </div>
                    <div className="lot-types">
                      {getProductTypeStats(lot)}
                    </div>
                  </div>
                </div>
              );
            })}
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
                <div className="total-value">
                  <strong>Total Value:</strong>
                  <span>{getTotalValue(selectedLot).value.toLocaleString()} {getTotalValue(selectedLot).currency}</span>
                </div>
                {canWithdraw(selectedLot.status) && (
                  <div className="lot-actions">
                    <button
                      className={`withdraw-btn-large ${selectedLot.status === LotStatus.PENDING ? 'withdraw-btn-delete' : 'withdraw-btn-request'}`}
                      onClick={(e) => handleWithdraw(selectedLot.lotId, e)}
                      disabled={withdrawingLots.has(selectedLot.lotId)}
                    >
                      {withdrawingLots.has(selectedLot.lotId) ? 'Processing...' : getWithdrawButtonText(selectedLot.status)}
                    </button>
                  </div>
                )}
              </div>

              <div className="lot-products">
                <h3>Products in this Lot</h3>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Type</th>
                      <th>Import Price</th>
                      <th>Selling Price</th>
                      <th>Margin</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLot.products.map(product => {
                      const margin = product.secondaryPrice && product.primaryPrice
                        ? ((product.secondaryPrice.value - product.primaryPrice.value) / product.primaryPrice.value * 100)
                        : null;

                      return (
                        <tr key={product.productId}>
                          <td className="product-name">{product.productName}</td>
                          <td>
                            <span className="product-type-badge">{product.productType}</span>
                          </td>
                          <td>
                            {product.primaryPrice
                              ? `${product.primaryPrice.value.toLocaleString()} ${product.primaryPrice.currency}`
                              : 'N/A'}
                          </td>
                          <td>
                            {product.secondaryPrice
                              ? `${product.secondaryPrice.value.toLocaleString()} ${product.secondaryPrice.currency}`
                              : <span className="not-set">Not set</span>}
                          </td>
                          <td>
                            {margin !== null ? (
                              <span className={`margin ${margin > 0 ? 'positive' : margin < 0 ? 'negative' : 'neutral'}`}>
                                {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="not-available">N/A</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="details-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                // You can add a modal or expand functionality here
                                console.log('Product details:', product.details);
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

export default SupplierLotHistory;