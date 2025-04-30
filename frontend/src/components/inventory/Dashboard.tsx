import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import ProductTypeChart from './ProductTypeChart';
import Magnet from '../advancedanimation/Magnet';
import inventoryService from '../../services/inventoryService';

interface SummaryStatistics {
  totalProducts: number;
  overallUtilization: number;
  overallTurnoverRate: number;
  expiringProductsCount: number;
  monthlyGrowthRate: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStatistics | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analytics = await inventoryService.getInventoryAnalytics();
        setSummaryStats(analytics.summaryStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory analytics:', err);
        setError('Failed to load inventory analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (

    <div className="dashboard-container">
    <Magnet padding={100} disabled={false} magnetStrength={100}>
      <h1>Inventory Dashboard</h1>
    </Magnet>
      {loading ? (
        <div className="loading-spinner">Loading dashboard data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {summaryStats && (
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Products</h3>
                <div className="card-value">{summaryStats.totalProducts}</div>
              </div>
              <div className="summary-card">
                <h3>Storage Utilization</h3>
                <div className="card-value">{(summaryStats.overallUtilization * 100).toFixed(1)}%</div>
              </div>
              <div className="summary-card">
                <h3>Turnover Rate</h3>
                <div className="card-value">{summaryStats.overallTurnoverRate.toFixed(2)}</div>
              </div>
              <div className="summary-card highlight">
                <h3>Expiring Soon</h3>
                <div className="card-value">{summaryStats.expiringProductsCount}</div>
              </div>
              <div className="summary-card">
                <h3>Monthly Growth</h3>
                <div className="card-value">
                  {(summaryStats.monthlyGrowthRate * 100).toFixed(1)}%
                  {summaryStats.monthlyGrowthRate > 0 ? '↑' : '↓'}
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-charts">
            <div className="chart-container">
              <ProductTypeChart />
            </div>
            {/* Additional charts can be added here */}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;