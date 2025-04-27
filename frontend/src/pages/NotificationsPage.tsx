import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationsPage.css';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, clearAll, isConnected } = useNotifications();
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Group notifications by date
  const groupNotificationsByDate = () => {
    const groups: { [key: string]: any[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(notification);
    });
    
    return groups;
  };

  const notificationGroups = groupNotificationsByDate();

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
            {!isConnected && (
              <button 
                className="retry-button" 
                onClick={() => window.location.reload()}
                title="Refresh page to reconnect"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.15181 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          {notifications.length > 0 && (
            <button 
              className="clear-all-btn" 
              onClick={clearAll}
              aria-label="Clear all notifications"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {Object.keys(notificationGroups).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5C16.3402 5.8193 18 8.13232 18 10.8889V15.5556L20 17.5556V18.5556H4V17.5556L6 15.5556V10.8889C6 8.13232 7.65979 5.8193 10 5Z" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 18.5C9 20.433 10.343 22 12 22C13.657 22 15 20.433 15 18.5" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>No notifications yet</h2>
          <p>You'll see your notifications here when they arrive</p>
        </div>
      ) : (
        <div className="notifications-list">
          {Object.entries(notificationGroups).map(([date, groupNotifications]) => (
            <div key={date} className="notification-group">
              <div className="notification-date">{date}</div>
              <div className="notification-items">
                {groupNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-content">
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatDate(notification.createdAt)}</div>
                    </div>
                    {!notification.isRead && (
                      <button 
                        className="mark-read-btn"
                        onClick={() => markAsRead(notification.id)}
                        aria-label="Mark as read"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Mark as read</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;