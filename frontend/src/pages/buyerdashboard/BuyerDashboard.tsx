import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Alert, Input, Select, Card, Tag, Button, Modal, notification, InputNumber } from "antd"
import { SearchOutlined, ShoppingCartOutlined, EyeOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons"
import inventoryService from "../../services/inventoryService"
import "./BuyerDashboard.css"

const { Search } = Input
const { Option } = Select

interface ProductSummary {
  productId: string
  productType: string
  name: string
  detail: Record<string, any>
  count: number
  exportQuantity?: number
  productIds?: string[] // Array of all product IDs in this group
}

interface LotSummary {
  lotId: string
  lotCode: string
  importDate: string
  importedByUser: string
  status: any
  products: ProductSummary[]
  totalProducts: number
  productTypes: string
}

interface ProductDetailModalProps {
  product: ProductSummary | null
  isVisible: boolean
  onClose: () => void
  onQuantityChange: (quantity: number) => void
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isVisible, onClose, onQuantityChange }) => {
  if (!product) return null

  const handleQuantityChange = (value: number | null) => {
    const quantity = Math.max(0, Math.min(value || 0, product.count))
    onQuantityChange(quantity)
  }

  return (
    <Modal
      title={
        <div className="enhanced-modal-title">
          <EyeOutlined /> Product Details
        </div>
      }
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="enhanced-modal-button">
          Close
        </Button>,
      ]}
      width={800}
      className="enhanced-product-modal"
    >
      <div className="enhanced-product-detail-modal">
        <div className="enhanced-product-basic-info">
          <h3>{product.name}</h3>
          <div className="enhanced-product-meta">
            <Tag color="blue" className="enhanced-tag">
              {product.productType}
            </Tag>
            <Tag color="green" className="enhanced-tag">
              Available: {product.count}
            </Tag>
          </div>
        </div>

        <div className="enhanced-product-details-grid">
          {Object.entries(product.detail).map(([key, value]) => {
            if (key === "primaryPrice" || key === "primaryCurrency" || key === "secondaryPrice" || key === "secondaryCurrency") {
              return null
            }

            let displayKey = key
              .replace(/_/g, " ")
              .replace(/([A-Z])/g, " $1")
              .trim()
            displayKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1)

            return (
              <div key={key} className="enhanced-detail-item">
                <span className="enhanced-detail-key">{displayKey}:</span>
                <span className="enhanced-detail-value">{String(value)}</span>
              </div>
            )
          })}
        </div>

        <div className="enhanced-modal-quantity-section">
          <h4>Request Quantity</h4>
          <div className="enhanced-quantity-controls">
            <Button
              icon={<MinusOutlined />}
              onClick={() => handleQuantityChange((product.exportQuantity || 0) - 1)}
              disabled={!product.exportQuantity || product.exportQuantity <= 0}
              className="enhanced-quantity-btn"
            />
            <InputNumber
              min={0}
              max={product.count}
              value={product.exportQuantity || 0}
              onChange={handleQuantityChange}
              className="enhanced-quantity-input"
            />
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleQuantityChange((product.exportQuantity || 0) + 1)}
              disabled={(product.exportQuantity || 0) >= product.count}
              className="enhanced-quantity-btn"
            />
            <span className="enhanced-quantity-max">(max {product.count})</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

const BuyerDashboard: React.FC = () => {
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [lots, setLots] = useState<LotSummary[]>([])
  const [filteredLots, setFilteredLots] = useState<LotSummary[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductSummary[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'lots' | 'products'>('lots')
  const [selectedLot, setSelectedLot] = useState<LotSummary | null>(null)

  const { user } = useAuth()

  // Helper function to group products by their details (similar to backend logic)
  const groupProductsByDetail = (productList: ProductSummary[]): ProductSummary[] => {
    const grouped = new Map<string, ProductSummary>()
    
    for (const product of productList) {
      // Create a key based on product type, name, and key details (excluding variable fields like IDs)
      const detailKey = Object.entries(product.detail)
        .filter(([key]) => !key.toLowerCase().includes('id')) // Exclude ID fields from grouping
        .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistent keys
        .map(([key, value]) => `${key}:${value}`)
        .join('|')
      
      const key = `${product.productType}|${product.name}|${detailKey}`
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!
        existing.count += product.count
        // Keep track of all product IDs for this group
        if (!existing.productIds) {
          existing.productIds = [existing.productId]
        }
        existing.productIds.push(product.productId)
      } else {
        const groupedProduct = { ...product }
        groupedProduct.productIds = [product.productId]
        grouped.set(key, groupedProduct)
      }
    }
    
    return Array.from(grouped.values())
  }

  useEffect(() => {
    if (user?.role !== "SUPPLIER" && user?.role !== "TEMPORARY") {
      setError("Only suppliers and temporary users can access this dashboard")
      setIsLoading(false)
      return
    }

    fetchLots()
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [lots, products, searchTerm, filterType, viewMode])

  const fetchLots = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const lotData = await inventoryService.getProductsByLotForSupplierOrTemporary()
      console.log("Fetched lot data:", lotData) // Debug log
      
      const transformedLots: LotSummary[] = lotData.map((lot: any) => ({
        lotId: lot.lotId,
        lotCode: lot.lotCode,
        importDate: lot.importDate,
        importedByUser: lot.importedByUser,
        status: lot.status,
        products: lot.products.map((product: any) => ({
          productId: product.productId,
          productType: product.productType,
          name: product.productName,
          detail: product.details,
          count: 1, // Each individual product has count 1
          exportQuantity: 0
        })),
        totalProducts: lot.products.length, // This counts individual products (not grouped)
        productTypes: Array.from(new Set(lot.products.map((p: any) => p.productType))).join(', ')
      }))
      
      console.log("Transformed lots:", transformedLots) // Debug log
      setLots(transformedLots)
      
      // Create grouped product data from lots - this matches backend's grouping logic
      const allProductsFromLots = transformedLots.flatMap(lot => lot.products)
      const groupedProducts = groupProductsByDetail(allProductsFromLots)
      console.log("All individual products from lots:", allProductsFromLots.length) // Debug log
      console.log("Grouped products:", groupedProducts.length) // Debug log
      setProducts(groupedProducts)
      
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    if (viewMode === 'lots') {
      let filtered = [...lots]

      if (searchTerm) {
        filtered = filtered.filter(
          (lot) =>
            lot.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lot.products.some(product =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.productType.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
      }

      if (filterType !== "all") {
        filtered = filtered.filter((lot) => 
          lot.products.some(product => product.productType === filterType)
        )
      }

      setFilteredLots(filtered)
    } else {
      let filtered = [...products]

      if (searchTerm) {
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            Object.values(product.detail).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
        )
      }

      if (filterType !== "all") {
        filtered = filtered.filter((product) => product.productType === filterType)
      }

      setFilteredProducts(filtered)
    }
  }

  const handleProductClick = (product: ProductSummary) => {
    setSelectedProduct(product)
    setIsModalVisible(true)
  }

  const handleModalClose = () => {
    setIsModalVisible(false)
    setSelectedProduct(null)
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    // Update products array
    const updatedProducts = products.map((product) =>
      product.productId === productId
        ? { ...product, exportQuantity: Math.max(0, Math.min(quantity, product.count)) }
        : product,
    )
    setProducts(updatedProducts)

    // Update lots array to reflect changes in nested products
    const updatedLots = lots.map((lot) => ({
      ...lot,
      products: lot.products.map((product) =>
        product.productId === productId
          ? { ...product, exportQuantity: Math.max(0, Math.min(quantity, product.count)) }
          : product
      )
    }))
    setLots(updatedLots)

    // Update filtered products if in product view
    if (viewMode === 'products') {
      const updatedFilteredProducts = filteredProducts.map((product) =>
        product.productId === productId
          ? { ...product, exportQuantity: Math.max(0, Math.min(quantity, product.count)) }
          : product,
      )
      setFilteredProducts(updatedFilteredProducts)
    }

    // Update selected product in modal if it matches
    if (selectedProduct && selectedProduct.productId === productId) {
      setSelectedProduct({ ...selectedProduct, exportQuantity: Math.max(0, Math.min(quantity, selectedProduct.count)) })
    }
  }

  const handleModalQuantityChange = (quantity: number) => {
    if (selectedProduct) {
      handleQuantityChange(selectedProduct.productId, quantity)
    }
  }

  const handleSubmitRetrieveRequest = async () => {
    const productsToRetrieve = products
      .filter((p) => p.exportQuantity && p.exportQuantity > 0)
      .map((p) => ({
        productId: p.productId,
        name: p.name,
        detail: p.detail,
        quantity: p.exportQuantity!,
      }))

    if (productsToRetrieve.length === 0) {
      notification.warning({
        message: "Warning",
        description: "No products selected for retrieval.",
        placement: "topRight",
      })
      return
    }

    const totalQuantity = productsToRetrieve.reduce((sum, product) => {
      return sum + product.quantity; // Just count quantities, no price calculation
    }, 0);

    Modal.confirm({
      title: "Confirm Retrieval Request",
      className: "enhanced-confirm-modal",
      content: (
        <div className="enhanced-confirm-content">
          <p>Products to retrieve:</p>
          <ul className="enhanced-product-list">
            {productsToRetrieve.map((product) => (
              <li key={product.productId} className="enhanced-product-item">
                <strong>{product.name}</strong> - Quantity: {product.quantity}
              </li>
            ))}
          </ul>
        </div>
      ),
      onOk: async () => {
        try {
          setIsSubmitting(true)
          setError(null)
          const result = await inventoryService.createRetrieveRequest({ products: productsToRetrieve })
          setSubmitSuccess(true)
          if (result && typeof result === "string") {
            setRequestId(result)
          }
          const resetProducts = products.map((product) => ({
            ...product,
            exportQuantity: undefined,
          }))
          setProducts(resetProducts)

          notification.success({
            message: "Success",
            description: "Your retrieval request has been submitted successfully!",
            placement: "topRight",
          })
        } catch (err: any) {
          console.error("Retrieve request error:", err)
          if (err.response && err.response.status === 403) {
            setError("You do not have permission to create retrieve requests. Please check your account role.")
          } else if (err.message) {
            setError(`Failed to submit retrieval request: ${err.message}`)
          } else {
            setError("Failed to submit retrieval request. Please try again later.")
          }
          setSubmitSuccess(false)

          notification.error({
            message: "Error",
            description: "Failed to submit retrieval request. Please try again.",
            placement: "topRight",
          })
        } finally {
          setIsSubmitting(false)
        }
      },
    })
  }

  const handleResetSelection = () => {
    const resetProducts = products.map((product) => ({
      ...product,
      exportQuantity: undefined,
    }))
    setProducts(resetProducts)

    // Also reset lots
    const resetLots = lots.map((lot) => ({
      ...lot,
      products: lot.products.map((product) => ({
        ...product,
        exportQuantity: undefined,
      }))
    }))
    setLots(resetLots)

    // Reset filtered products
    const resetFilteredProducts = filteredProducts.map((product) => ({
      ...product,
      exportQuantity: undefined,
    }))
    setFilteredProducts(resetFilteredProducts)

    setSubmitSuccess(false)
    setRequestId(null)
  }

  const getUniqueProductTypes = () => {
    if (viewMode === 'lots') {
      const types = lots.flatMap(lot => lot.products.map(p => p.productType))
      return Array.from(new Set(types))
    } else {
      const types = products.map((p) => p.productType)
      return Array.from(new Set(types))
    }
  }

  const handleLotClick = (lot: LotSummary) => {
    setSelectedLot(lot)
    setViewMode('products')
    
    // Check if lot has any available products
    if (lot.products.length === 0) {
      setFilteredProducts([])
      setError("This lot has no available products. All products may have been dispatched already.")
    } else {
      // Group the lot products to match the backend behavior
      const groupedLotProducts = groupProductsByDetail(lot.products)
      setFilteredProducts(groupedLotProducts)
      setError(null)
    }
    
    setSearchTerm('')
    setFilterType('all')
  }

  const handleBackToLots = () => {
    setSelectedLot(null)
    setViewMode('lots')
    setSearchTerm('')
    setFilterType('all')
    setError(null) // Clear any errors when going back to lots view
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusClass = (status: any) => {
    if (!status) return 'status-imported'
    switch (status) {
      case 'PENDING': return 'status-pending'
      case 'ACCEPTED': return 'status-accepted'
      case 'REJECTED': return 'status-rejected'
      default: return 'status-imported'
    }
  }

  const getStatusDisplay = (status: any) => {
    if (!status) return 'IMPORTED'
    switch (status) {
      case 'PENDING': return 'PENDING APPROVAL'
      case 'ACCEPTED': return 'ACCEPTED'
      case 'REJECTED': return 'REJECTED'
      default: return 'UNKNOWN'
    }
  }

  const getAvailabilityStatus = (count: number) => {
    if (count === 0) return { color: "red", text: "Out of Stock" }
    if (count < 10) return { color: "orange", text: "Low Stock" }
    return { color: "green", text: "In Stock" }
  }

  const getSelectedProductsCount = () => {
    return products.filter((p) => p.exportQuantity && p.exportQuantity > 0).length
  }

  const getSelectedProductsQuantity = () => {
    return products
      .filter((p) => p.exportQuantity && p.exportQuantity > 0)
      .reduce((sum, product) => sum + (product.exportQuantity || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="enhanced-buyer-dashboard">
        <div className="enhanced-dashboard-header">
          <div className="enhanced-header-content">
            <h1>
              <ShoppingCartOutlined /> Product Catalog
            </h1>
            <p>Browse and request products from our inventory</p>
          </div>
        </div>
        <div className="enhanced-loading-container">
          <div className="enhanced-loading-spinner" />
          <p>Loading products...</p>
        </div>
      </div>
    )
  }

  if (error && !selectedLot) {
    return (
      <div className="enhanced-buyer-dashboard">
        <div className="enhanced-dashboard-header">
          <div className="enhanced-header-content">
            <h1>
              <ShoppingCartOutlined /> Product Catalog
            </h1>
            <p>Browse and request products from our inventory</p>
          </div>
        </div>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="enhanced-error-alert"
          action={
            <Button size="small" onClick={fetchLots} className="enhanced-retry-btn">
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="enhanced-buyer-dashboard enhanced-success-state">
        <div className="enhanced-dashboard-header">
          <div className="enhanced-header-content">
            <h1>
              <ShoppingCartOutlined /> Product Catalog
            </h1>
            <p>Browse and request products from our inventory</p>
          </div>
        </div>
        <Alert
          message="Retrieval Request Submitted"
          description={
            <div className="enhanced-success-content">
              <p>Your product retrieval request has been submitted successfully!</p>
              <p className="enhanced-request-id">Request ID: {requestId || "Generated"}</p>
              <p>An administrator will review your request soon. You'll be notified when it's processed.</p>
            </div>
          }
          type="success"
          showIcon
          className="enhanced-success-alert"
        />
        <div className="enhanced-success-actions">
          <Button type="primary" onClick={handleResetSelection} className="enhanced-action-btn">
            Browse More Products
          </Button>
          <Button onClick={() => window.location.reload()} className="enhanced-action-btn">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-buyer-dashboard">
      <div className="enhanced-dashboard-header">
        <div className="enhanced-header-content">
          <h1>
            <ShoppingCartOutlined /> Product Catalog
          </h1>
          <p>Browse and request products from our inventory</p>
        </div>
      </div>

      <div className="enhanced-filters-section">
        <div className="enhanced-search-container">
          <Search
            placeholder={viewMode === 'lots' ? "Search lots by code or product..." : "Search products by name, type, or details..."}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            size="large"
            className="enhanced-search-input"
          />
        </div>

        <div className="enhanced-filter-container">
          <Select value={filterType} onChange={setFilterType} size="large" className="enhanced-filter-select">
            <Option value="all">All Products</Option>
            {getUniqueProductTypes().map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </div>

        {selectedLot && (
          <div className="enhanced-lot-breadcrumb">
            <Button onClick={handleBackToLots} className="enhanced-back-btn">
              ← Back to Lots
            </Button>
            <span className="enhanced-current-lot">
              Viewing products from: <strong>{selectedLot.lotCode}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="enhanced-products-summary">
        <div className="enhanced-summary-stats">
          {viewMode === 'lots' ? (
            <>
              <div className="enhanced-stat-item">
                <div className="enhanced-stat-icon">📦</div>
                <span className="enhanced-stat-number">{filteredLots.length}</span>
                <span className="enhanced-stat-label">Lots Found</span>
              </div>
              <div className="enhanced-stat-item">
                <div className="enhanced-stat-icon">📊</div>
                <span className="enhanced-stat-number">{getUniqueProductTypes().length}</span>
                <span className="enhanced-stat-label">Product Types</span>
              </div>
              <div className="enhanced-stat-item">
                <div className="enhanced-stat-icon">📈</div>
                <span className="enhanced-stat-number">{filteredLots.reduce((sum, lot) => sum + lot.totalProducts, 0)}</span>
                <span className="enhanced-stat-label">Total Products</span>
              </div>
            </>
          ) : (
            <>
              <div className="enhanced-stat-item">
                <div className="enhanced-stat-icon">📦</div>
                <span className="enhanced-stat-number">{filteredProducts.length}</span>
                <span className="enhanced-stat-label">Products Found</span>
              </div>
              <div className="enhanced-stat-item">
                <div className="enhanced-stat-icon">📊</div>
                <span className="enhanced-stat-number">{getUniqueProductTypes().length}</span>
                <span className="enhanced-stat-label">Product Types</span>
              </div>
              <div className="enhanced-stat-item">
                <div className="enhanced-stat-icon">📈</div>
                <span className="enhanced-stat-number">{filteredProducts.reduce((sum, p) => sum + p.count, 0)}</span>
                <span className="enhanced-stat-label">Total Items</span>
              </div>
            </>
          )}
          <div className="enhanced-stat-item enhanced-selected-stats">
            <div className="enhanced-stat-icon">🛒</div>
            <span className="enhanced-stat-number">{getSelectedProductsCount()}</span>
            <span className="enhanced-stat-label">Selected</span>
          </div>
        </div>
      </div>

      {getSelectedProductsCount() > 0 && (
        <div className="enhanced-cart-summary">
          <div className="enhanced-cart-info">
            <span className="enhanced-cart-count">{getSelectedProductsCount()} product(s) selected</span>
            <span className="enhanced-cart-total">Total Quantity: {getSelectedProductsQuantity()} items</span>
          </div>
          <div className="enhanced-cart-actions">
            <Button onClick={handleResetSelection} className="enhanced-cart-btn">
              Clear Selection
            </Button>
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={handleSubmitRetrieveRequest}
              className="enhanced-cart-btn enhanced-submit-btn"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      )}

      {error && selectedLot && (
        <Alert
          message="Information"
          description={error}
          type="info"
          showIcon
          className="enhanced-error-alert"
          style={{ marginBottom: '16px' }}
        />
      )}

      {viewMode === 'lots' ? (
        filteredLots.length === 0 ? (
          <div className="enhanced-no-products">
            <ShoppingCartOutlined className="enhanced-no-products-icon" />
            <h3>No lots found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="enhanced-lots-grid">
            {filteredLots.map((lot) => (
              <Card
                key={lot.lotId}
                className="enhanced-lot-card"
                hoverable
                onClick={() => handleLotClick(lot)}
              >
                <div className="enhanced-lot-card-content">
                  <div className="enhanced-lot-header">
                    <h3 className="enhanced-lot-code">Lot: {lot.lotCode}</h3>
                    <div className="enhanced-lot-status">
                      <span className={getStatusClass(lot.status)}>
                        {getStatusDisplay(lot.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="enhanced-lot-info">
                    <div className="enhanced-lot-date">
                      Imported: {formatDate(lot.importDate)}
                    </div>
                    <div className="enhanced-lot-summary">
                      {lot.totalProducts} {lot.totalProducts === 1 ? 'product' : 'products'}
                    </div>
                    <div className="enhanced-lot-types">
                      Types: {lot.productTypes}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        filteredProducts.length === 0 ? (
          <div className="enhanced-no-products">
            <ShoppingCartOutlined className="enhanced-no-products-icon" />
            {selectedLot ? (
              <>
                <h3>No available products in this lot</h3>
                <p>All products from lot {selectedLot.lotCode} may have been dispatched already.</p>
                <Button onClick={handleBackToLots} type="primary" className="enhanced-back-btn">
                  Back to Lots
                </Button>
              </>
            ) : (
              <>
                <h3>No products found</h3>
                <p>Try adjusting your search criteria or filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="enhanced-products-grid">
            {filteredProducts.map((product) => {
              const availability = getAvailabilityStatus(product.count)
              const hasQuantitySelected = product.exportQuantity && product.exportQuantity > 0

              return (
                <Card
                  key={product.productId}
                  className={`enhanced-product-card ${hasQuantitySelected ? "enhanced-selected" : ""}`}
                  hoverable
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={(e: React.MouseEvent<HTMLElement>) => {
                        e.stopPropagation()
                        handleProductClick(product)
                      }}
                      className="enhanced-view-btn"
                    >
                      View Details
                    </Button>,
                  ]}
                >
                  <div className="enhanced-product-card-content">
                    <div className="enhanced-product-header">
                      <h3 className="enhanced-product-name">{product.name}</h3>
                      <Tag color="blue" className="enhanced-product-type-tag">
                        {product.productType}
                      </Tag>
                    </div>

                    <div className="enhanced-product-info">
                      <div className="enhanced-availability-info">
                        <Tag color={availability.color} className="enhanced-availability-tag">
                          {availability.text} ({product.count} units)
                        </Tag>
                      </div>
                    </div>

                    <div className="enhanced-product-preview">
                      {Object.entries(product.detail)
                        .filter(
                          ([key]) =>
                            !["primaryPrice", "primaryCurrency", "secondaryPrice", "secondaryCurrency"].includes(key),
                        )
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key} className="enhanced-preview-item">
                            <span className="enhanced-preview-key">
                              {key
                                .replace(/_/g, " ")
                                .replace(/([A-Z])/g, " $1")
                                .trim()}
                              :
                            </span>
                            <span className="enhanced-preview-value">{String(value)}</span>
                          </div>
                        ))}
                    </div>

                    <div className="enhanced-quantity-section">
                      <div className="enhanced-quantity-controls">
                        <Button
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={(e: React.MouseEvent<HTMLElement>) => {
                            e.stopPropagation()
                            handleQuantityChange(product.productId, (product.exportQuantity || 0) - 1)
                          }}
                          disabled={!product.exportQuantity || product.exportQuantity <= 0}
                          className="enhanced-quantity-btn"
                        />
                        <InputNumber
                          size="small"
                          min={0}
                          max={product.count}
                          value={product.exportQuantity || 0}
                          onChange={(value: number | null) => handleQuantityChange(product.productId, value || 0)}
                          className="enhanced-quantity-input"
                          onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                        />
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={(e: React.MouseEvent<HTMLElement>) => {
                            e.stopPropagation()
                            handleQuantityChange(product.productId, (product.exportQuantity || 0) + 1)
                          }}
                          disabled={(product.exportQuantity || 0) >= product.count}
                          className="enhanced-quantity-btn"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      <ProductDetailModal
        product={selectedProduct}
        isVisible={isModalVisible}
        onClose={handleModalClose}
        onQuantityChange={handleModalQuantityChange}
      />
    </div>
  )
}

export default BuyerDashboard
