import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import './ProductTypeChart.css';

interface StorageAllocationData {
  productType: string;
  value: number;
  percentage: number;
}

const ProductTypeChart: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StorageAllocationData[]>([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await inventoryService.getProductTypeDistribution();
        setData(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching product type distribution:', err);
        setError('Failed to load product type distribution data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatProductType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return <div className="loading">Loading product distribution data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const chartData = data.map((item, index) => ({
    name: formatProductType(item.productType),
    value: item.value,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="product-type-chart-container">
      <h2>Product Type Distribution</h2>
      
      <div className="chart-wrapper">
        <div className="bar-chart">
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className="bar-item"
              style={{ 
                width: `${Math.max(item.percentage * 100, 5)}%`,
                backgroundColor: item.color 
              }}
              title={`${item.name}: ${item.value} items (${(item.percentage * 100).toFixed(1)}%)`}
            >
              {item.percentage > 0.05 && (
                <span className="bar-label">{(item.percentage * 100).toFixed(0)}%</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="donut-chart-container">
          <div className="donut-chart">
            {chartData.map((item, index, arr) => {
              const circumference = 2 * Math.PI * 50; // 50 is the radius
              const strokeDasharray = (item.percentage * circumference) + ' ' + circumference;
              
              let strokeDashoffset = 0;
              for (let i = 0; i < index; i++) {
                strokeDashoffset -= arr[i].percentage * circumference;
              }
              
              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90) translate(-120, 0)"
                />
              );
            })}
            <text x="60" y="65" textAnchor="middle" className="donut-text">{total}</text>
          </div>
        </div>
      </div>
      
      <div className="chart-summary">
        <h3>Inventory Summary</h3>
        <ul className="summary-list">
          {chartData.map((item, index) => (
            <li key={index} className="summary-item">
              <span className="summary-color" style={{ backgroundColor: item.color }}></span>
              <span className="summary-name">{item.name}:</span>
              <span className="summary-value">{item.value} items</span>
              <span className="summary-percentage">({(item.percentage * 100).toFixed(1)}%)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProductTypeChart;