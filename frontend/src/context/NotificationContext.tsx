import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import websocketService, { 
  Notification, 
  WebSocketEvent,
} from '../services/websocket.service';
import notificationService from '../services/notificationService';
import { getUserId, getUserRole } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isConnected: boolean;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  isConnected: false,
  refreshNotifications: async () => {}
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth();

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {}
  }, [isAuthenticated]);

  const handleNotification = useCallback((notification: Notification) => {
    if (!notification || typeof notification !== 'object' || !notification.id) {
      return;
    }
    
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      
      return [notification, ...prev];
    });
    
    if (window.Notification && window.Notification.permission === 'granted') {
      try {
        const browserNotification = new window.Notification('Smart Inventory', {
          body: notification.content,
          icon: '/logo.png',
          tag: `notification-${notification.id}`,
          requireInteraction: false, 
          silent: false
        });
        
        browserNotification.onclick = () => {
          window.focus();
        };
      } catch (error) {}
    } else if (window.Notification && window.Notification.permission !== 'denied') {
      window.Notification.requestPermission();
    }
  }, []);

  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    
    notificationService.markAsRead(id).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    
    notificationService.markAllAsRead().catch(() => {});
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    }
  }, [isAuthenticated, refreshNotifications]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userId = getUserId() || user.username;
      const isAdmin = getUserRole() === 'ADMIN';
      let connectTimeoutId: NodeJS.Timeout | null = null;
      
      if (window.Notification && window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
      
      const handleConnect = () => {
        setIsConnected(true);
      };
      
      const handleDisconnect = () => {
        setIsConnected(false);
      };
      
      const handleError = (error: any) => {};
      
      websocketService.addEventListener(WebSocketEvent.CONNECT, handleConnect);
      websocketService.addEventListener(WebSocketEvent.DISCONNECT, handleDisconnect);
      websocketService.addEventListener(WebSocketEvent.ERROR, handleError);
      websocketService.addEventListener(WebSocketEvent.NOTIFICATION, handleNotification);
      
      if (isAdmin) {
        websocketService.addEventListener(WebSocketEvent.ADMIN_NOTIFICATION, handleNotification);
      }
      
      const establishConnection = () => {
        websocketService.connect(userId)
          .then(() => {
            if (connectTimeoutId) {
              clearTimeout(connectTimeoutId);
              connectTimeoutId = null;
            }
          })
          .catch(error => {
            connectTimeoutId = setTimeout(() => {
              establishConnection();
            }, 5000);
          });
      };
      
      establishConnection();
      
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
      markAllAsRead, 
      clearAll,
      isConnected,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
