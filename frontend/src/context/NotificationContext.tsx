import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import websocketService, { 
  Notification, 
  WebSocketEvent,
  WebSocketCallback,
  IWebSocketService 
} from '../services/websocket.service';
import { getUserId, getUserRole } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  clearAll: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearAll: () => {},
  isConnected: false
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth();

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Handle new notification
  const handleNotification = useCallback((notification: Notification) => {
    // Validate notification
    if (!notification || typeof notification !== 'object' || !notification.id) {
      console.error('Received invalid notification:', notification);
      return;
    }
    
    // Check for duplicate notifications
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      
      // Add new notification at the beginning
      return [notification, ...prev];
    });
    
    // Show browser notification if supported and permission granted
    if (window.Notification && window.Notification.permission === 'granted') {
      try {
        const browserNotification = new window.Notification('Smart Inventory', {
          body: notification.message,
          icon: '/logo.png',
          tag: `notification-${notification.id}`, // Prevents duplicate notifications
          requireInteraction: false, // Auto-close after a while
          silent: false // Play sound
        });
        
        // Add click handler to focus the window and navigate to notifications page
        browserNotification.onclick = () => {
          window.focus();
          if (window.location.pathname !== '/notifications') {
            // Use React Router programmatically or a simple window.location
            // history.push('/notifications'); // If using React Router
            // window.location.href = '/notifications'; // Alternative
          }
        };
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    } else if (window.Notification && window.Notification.permission !== 'denied') {
      // Request permission if not granted or denied
      window.Notification.requestPermission();
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: number) => {
    // Update UI immediately for better user experience
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    
    // Send request to server
    websocketService.markNotificationAsRead(id)
      .catch(error => {
        console.error('Failed to mark notification as read:', error);
        // Optionally revert the UI update if server request fails
        // Uncomment if you want to revert the UI on failure
        /*
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id && notification.isRead
              ? { ...notification, isRead: false } 
              : notification
          )
        );
        */
      });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const userId = getUserId() || user.username;
      const isAdmin = getUserRole() === 'ADMIN';
      let connectTimeoutId: NodeJS.Timeout | null = null;
      
      // Request notification permission
      if (window.Notification && window.Notification.permission === 'default') {
        window.Notification.requestPermission()
          .then(permission => {
            console.log(`Notification permission: ${permission}`);
          })
          .catch(error => {
            console.warn('Error requesting notification permission:', error);
          });
      }
      
      // Handle connection status
      const handleConnect = () => {
        console.log('Connected to notification service');
        setIsConnected(true);
      };
      
      const handleDisconnect = () => {
        console.log('Disconnected from notification service');
        setIsConnected(false);
      };
      
      const handleError = (error: any) => {
        console.error('Notification service error:', error);
        // You can show a toast or alert here if needed
      };
      
      // Add event listeners
      websocketService.addEventListener(WebSocketEvent.CONNECT, handleConnect);
      websocketService.addEventListener(WebSocketEvent.DISCONNECT, handleDisconnect);
      websocketService.addEventListener(WebSocketEvent.ERROR, handleError);
      websocketService.addEventListener(WebSocketEvent.NOTIFICATION, handleNotification);
      
      if (isAdmin) {
        websocketService.addEventListener(WebSocketEvent.ADMIN_NOTIFICATION, handleNotification);
      }
      
      // Function to establish connection
      const establishConnection = () => {
        // Connect to WebSocket
        websocketService.connect(userId)
          .then(() => {
            if (connectTimeoutId) {
              clearTimeout(connectTimeoutId);
              connectTimeoutId = null;
            }
          })
          .catch(error => {
            console.error('Failed to connect to notification service:', error);
            
            // Try to reconnect after delay if the component is still mounted
            connectTimeoutId = setTimeout(establishConnection, 5000);
          });
      };
      
      // Start connection
      establishConnection();
      
      // Disconnect when component unmounts
      return () => {
        if (connectTimeoutId) {
          clearTimeout(connectTimeoutId);
        }
        
        websocketService.removeEventListener(WebSocketEvent.CONNECT, handleConnect);
        websocketService.removeEventListener(WebSocketEvent.DISCONNECT, handleDisconnect);
        websocketService.removeEventListener(WebSocketEvent.ERROR, handleError);
        websocketService.removeEventListener(WebSocketEvent.NOTIFICATION, handleNotification);
        
        if (isAdmin) {
          websocketService.removeEventListener(WebSocketEvent.ADMIN_NOTIFICATION, handleNotification);
        }
        
        websocketService.disconnect();
      };
    }
  }, [isAuthenticated, user, handleNotification]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      clearAll,
      isConnected
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
