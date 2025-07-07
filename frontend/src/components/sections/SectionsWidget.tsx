import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Button } from 'antd';
import { AppstoreOutlined, DollarSignOutlined, ShopOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import './SectionsWidget.css';

interface SectionInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  usedSlots: number;
  totalSlots: number;
  numShelves: number;
  storageConditions: Array<{
    conditionType: string;
    minValue?: number;
    maxValue?: number;
    unit?: string;
  }>;
  priceInfo?: {
    monthlyPrice: number;
    pricePerSlot: number;
    currency: string;
  };
}

interface SectionWithUtilization extends SectionInfo {
  utilization: number;
}

interface SectionsSummary {
  totalSections: number;
  totalSlots: number;
  usedSlots: number;
  totalMonthlyCost: number;
  utilizationRate: number;
  topUtilizedSections: SectionWithUtilization[];
}

const SectionsWidget: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionsSummary, setSectionsSummary] = useState<SectionsSummary | null>(null);

  useEffect(() => {
    fetchSectionsSummary();
  }, []);

  const fetchSectionsSummary = async () => {
    try {
      setLoading(true);
      const sectionsData = await inventoryService.getSectionInfo();
      
      // Calculate summary statistics
      const totalSections = sectionsData.length;
      const totalSlots = sectionsData.reduce((sum: number, section: SectionInfo) => sum + section.totalSlots, 0);
      const usedSlots = sectionsData.reduce((sum: number, section: SectionInfo) => sum + section.usedSlots, 0);
      const totalMonthlyCost = sectionsData.reduce((sum: number, section: SectionInfo) => 
        sum + (section.priceInfo?.monthlyPrice || 0), 0);
      const utilizationRate = totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0;
      
      // Get top 3 most utilized sections
      const topUtilizedSections = sectionsData
        .filter((section: SectionInfo) => section.totalSlots > 0)
        .map((section: SectionInfo): SectionWithUtilization => ({
          ...section,
          utilization: (section.usedSlots / section.totalSlots) * 100
        }))
        .sort((a: SectionWithUtilization, b: SectionWithUtilization) => b.utilization - a.utilization)
        .slice(0, 3);

      setSectionsSummary({
        totalSections,
        totalSlots,
        usedSlots,
        totalMonthlyCost,
        utilizationRate,
        topUtilizedSections
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching sections data:', err);
      setError('Failed to load sections data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title={<span><AppstoreOutlined /> Warehouse Sections</span>} className="sections-widget">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>Loading sections data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={<span><AppstoreOutlined /> Warehouse Sections</span>} className="sections-widget">
        <Alert
          message="Error Loading Sections"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!sectionsSummary) {
    return (
      <Card title={<span><AppstoreOutlined /> Warehouse Sections</span>} className="sections-widget">
        <p>No sections data available</p>
      </Card>
    );
  }

  return (
    <Card 
      title={<span><AppstoreOutlined /> Warehouse Sections</span>} 
      className="sections-widget"
      extra={
        <Link to="/sections">
          <Button type="primary" size="small" icon={<EyeOutlined />}>
            View All
          </Button>
        </Link>
      }
    >
      <Row gutter={[16, 16]} className="sections-stats">
        <Col span={12}>
          <Statistic
            title="Total Sections"
            value={sectionsSummary.totalSections}
            prefix={<AppstoreOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Slot Utilization"
            value={sectionsSummary.utilizationRate}
            precision={1}
            suffix="%"
            prefix={<ShopOutlined />}
            valueStyle={sectionsSummary.utilizationRate > 80 
              ? { color: '#cf1322' } 
              : sectionsSummary.utilizationRate > 60 
                ? { color: '#faad14' } 
                : { color: '#3f8600' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Total Slots"
            value={`${sectionsSummary.usedSlots}/${sectionsSummary.totalSlots}`}
            prefix={<EnvironmentOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Monthly Cost"
            value={sectionsSummary.totalMonthlyCost}
            precision={2}
            prefix="$"
            suffix="/mo"
            valueStyle={{ color: '#eb2f96' }}
          />
        </Col>
      </Row>

      {sectionsSummary.topUtilizedSections.length > 0 && (
        <div className="top-sections">
          <h4 style={{ marginBottom: '12px', color: '#595959' }}>Most Utilized Sections</h4>
          <div className="sections-list">
            {sectionsSummary.topUtilizedSections.map((section, index) => {
              const utilization = (section.usedSlots / section.totalSlots) * 100;
              return (
                <div key={section.id} className="section-item">
                  <div className="section-info">
                    <span className="section-rank">#{index + 1}</span>
                    <span className="section-name">{section.name}</span>
                    <span className="section-utilization">
                      {utilization.toFixed(1)}% ({section.usedSlots}/{section.totalSlots})
                    </span>
                  </div>
                  <div className="section-progress">
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${utilization}%`,
                        backgroundColor: utilization > 80 ? '#ff4d4f' : utilization > 60 ? '#faad14' : '#52c41a'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SectionsWidget;
