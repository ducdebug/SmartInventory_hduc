import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Table, Button, Card, message, Typography, Empty } from 'antd';
import { CheckOutlined, BellOutlined } from '@ant-design/icons';
import notificationService from '../../services/notificationService';
import './NotificationsPage.css';

const { Title } = Typography;

interface TableRecord {
  id: number;
  key: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  [key: string]: any;
}

const NotificationsPage: React.FC = () => {
  const { notifications, refreshNotifications, markAllAsRead } = useNotifications();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleMarkAsReadBulk = async () => {
    if (selectedRowKeys.length === 0) {
      message.info('Please select at least one notification');
      return;
    }

    setLoading(true);
    try {
      const notificationIds = selectedRowKeys.map(key => Number(key));
      await Promise.all(notificationIds.map(id => notificationService.markAsRead(id)));
      
      message.success(`${selectedRowKeys.length} notification${selectedRowKeys.length > 1 ? 's' : ''} marked as read`);
      refreshNotifications();
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.filter(n => !n.isRead).length === 0) {
      message.info('No unread notifications');
      return;
    }

    setLoading(true);
    try {
      await markAllAsRead();
      message.success('All notifications marked as read');
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Failed to mark all notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const columns = [
    {
      title: 'Message',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => <div className="notification-message">{text}</div>
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Status',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 100,
      render: (isRead: boolean) => (
        <span className={`status-badge ${isRead ? 'read' : 'unread'}`}>
          {isRead ? 'Read' : 'Unread'}
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: TableRecord) => (
        !record.isRead ? (
          <Button 
            type="text" 
            icon={<CheckOutlined />} 
            onClick={() => handleMarkSingleAsRead(record.id)}
            className="mark-read-button"
          >
            Mark as read
          </Button>
        ) : null
      )
    }
  ];

  const handleMarkSingleAsRead = async (id: number) => {
    setLoading(true);
    try {
      await notificationService.markAsRead(id);
      message.success('Notification marked as read');
      refreshNotifications();
    } catch (error) {
      message.error('Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    getCheckboxProps: (record: TableRecord) => ({
      disabled: record.isRead, 
      name: record.id.toString(),
    }),
  };

  return (
    <div className="notifications-page">
      <Title level={2} className="page-title">
        <BellOutlined /> Notifications
      </Title>
      
      <Card className="notifications-card">
        <div className="actions-bar">
          <Button 
            type="primary" 
            onClick={handleMarkAsReadBulk} 
            disabled={selectedRowKeys.length === 0 || loading}
            className="action-button"
          >
            Mark Selected as Read
          </Button>
          <Button 
            onClick={handleMarkAllAsRead} 
            disabled={notifications.filter(n => !n.isRead).length === 0 || loading}
            className="action-button"
          >
            Mark All as Read
          </Button>
        </div>
        
        <Table 
          rowSelection={rowSelection}
          columns={columns} 
          dataSource={notifications.map(n => ({ ...n, key: n.id }))}
          pagination={{ pageSize: 10 }}
          rowClassName={(record: TableRecord) => record.isRead ? 'read-row' : 'unread-row'}
          loading={loading}
          locale={{
            emptyText: <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description={
                <span>No notifications yet</span>
              }
            />
          }}
        />
      </Card>
    </div>
  );
};

export default NotificationsPage;
