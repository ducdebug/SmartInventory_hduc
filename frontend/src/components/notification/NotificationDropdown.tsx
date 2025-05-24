import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useNotifications } from "../../context/NotificationContext"
import type { Notification } from "../../services/websocket.service"
import "./NotificationDropdown.css"

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    markAsRead(id)
  }

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
  }

  const closeModal = () => {
    setSelectedNotification(null)
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSecs < 60) {
      return 'just now';
    } else if (diffInMins < 60) {
      return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type: string) => {
    // Implement the logic to return the appropriate emoji based on the notification type
    return '🎉'; // Placeholder return, actual implementation needed
  };

  const getNotificationColor = (type: string) => {
    // Implement the logic to return the appropriate color based on the notification type
    return '#007bff'; // Placeholder return, actual implementation needed
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button 
        className="icon-button" 
        onClick={toggleDropdown}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5C16.3402 5.8193 18 8.13232 18 10.8889V15.5556L20 17.5556V18.5556H4V17.5556L6 15.5556V10.8889C6 8.13232 7.65979 5.8193 10 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 18.5C9 20.433 10.343 22 12 22C13.657 22 15 20.433 15 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-menu">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>No notifications yet</p>
                <span>We'll notify you when something arrives</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className="notification-avatar"
                    style={{ backgroundColor: getNotificationColor(notification.type || "default") }}
                  >
                    <span className="notification-emoji">{getNotificationIcon(notification.type || "default")}</span>
                  </div>
                  <div className="notification-content">
                    <div className="notification-header-text">
                      <div className="notification-title">{notification.title || "Notification"}</div>
                      <div className="notification-time">{getRelativeTime(notification.createdAt)}</div>
                    </div>
                    <div className="notification-message">{notification.content}</div>
                  </div>
                  {!notification.isRead && (
                    <button 
                      className="mark-read-btn"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      aria-label="Mark as read"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notification-footer">
              <a href="/notifications" className="view-all" onClick={() => setIsOpen(false)}>
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}

      {selectedNotification && (
        <div className="notification-modal-overlay" onClick={closeModal}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div
                className="notification-modal-avatar"
                style={{ backgroundColor: getNotificationColor(selectedNotification.type || "default") }}
              >
                <span className="notification-emoji">{getNotificationIcon(selectedNotification.type || "default")}</span>
              </div>
              <div className="notification-modal-title">
                <h3>{selectedNotification.title || "Notification"}</h3>
                <span className="notification-modal-time">{getRelativeTime(selectedNotification.createdAt)}</span>
              </div>
              <button className="notification-modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="notification-modal-content">
              <p>{selectedNotification.content}</p>
            </div>
            {selectedNotification.imgUrl && (
              <div className="notification-modal-image">
                <img src={selectedNotification.imgUrl} alt="Notification attachment" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
