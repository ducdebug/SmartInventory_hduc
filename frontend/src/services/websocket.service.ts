import { getAuthToken } from './authService';
import SockJS from 'sockjs-client';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';

export interface Notification {
  id: number;
  toUserId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export enum WebSocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  NOTIFICATION = 'notification',
  ADMIN_NOTIFICATION = 'admin_notification',
  ERROR = 'error'
}

export type WebSocketCallback = (data: any) => void;

export interface IWebSocketService {
  connect(userId: string): Promise<boolean>;
  disconnect(): void;
  markNotificationAsRead(notificationId: number): Promise<boolean>;
  getNotifications(): Notification[];
  getUnreadNotifications(): Notification[];
  addEventListener(event: WebSocketEvent, callback: WebSocketCallback): void;
  removeEventListener(event: WebSocketEvent, callback: WebSocketCallback): void;
  isConnected(): boolean;
}

class WebSocketService implements IWebSocketService {
  private static instance: WebSocketService;
  private stompClient: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private eventListeners: Map<WebSocketEvent, WebSocketCallback[]> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectInterval: number = 5000; // 5 seconds
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private userId: string = '';
  private notifications: Notification[] = [];

  constructor() {
    Object.values(WebSocketEvent).forEach(event => {
      this.eventListeners.set(event as WebSocketEvent, []);
    });
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.stompClient) {
        this.disconnect();
      }

      this.userId = userId;
      
      try {
        const token = getAuthToken();
        const headers: { [key: string]: string } = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
                this.stompClient = new Client({
          webSocketFactory: () => new SockJS('/ws'),
          connectHeaders: headers,
          debug: (str) => {
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000
        });
        
        this.stompClient.onConnect = (frame: IFrame) => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('Connected to WebSocket');
          
          this.subscribeToUserNotifications(userId);
                    if (userId === 'admin' || localStorage.getItem('userRole') === 'ADMIN') {
            this.subscribeToAdminNotifications();
          }
                    this.notifyListeners(WebSocketEvent.CONNECT, frame);
          resolve(true);
        };
        
        this.stompClient.onStompError = (frame: IFrame) => {
          console.error('STOMP error:', frame);
          this.notifyListeners(WebSocketEvent.ERROR, frame);
          reject(new Error(`STOMP error: ${frame.headers['message']}`));
        };
        
        this.stompClient.onWebSocketError = (event: Event) => {
          console.error('WebSocket error:', event);
          this.notifyListeners(WebSocketEvent.ERROR, event);
          this.attemptReconnect();
          reject(new Error('WebSocket connection error'));
        };
        
        this.stompClient.onWebSocketClose = () => {
          if (this.connected) {
            console.log('WebSocket connection closed');
            this.connected = false;
            this.notifyListeners(WebSocketEvent.DISCONNECT, null);
            this.attemptReconnect();
          }
        };
        
        this.stompClient.activate();
        
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const backoffInterval = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${backoffInterval/1000}s...`);
      
      this.reconnectTimeout = setTimeout(() => {
        const token = getAuthToken();
        if (!token) {
          console.warn('Authorization token not available for reconnection');
        }
        
        this.connect(this.userId).catch((error) => {
          console.warn('Reconnection attempt failed:', error);
        });
      }, backoffInterval);
    } else {
      console.error('Max reconnect attempts reached. Please refresh the page.');
      this.notifyListeners(WebSocketEvent.ERROR, { 
        message: 'Max reconnection attempts reached. Please refresh the page.' 
      });
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.stompClient) {
      try {
        this.subscriptions.forEach(subscription => {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.warn('Error unsubscribing:', error);
          }
        });
        this.subscriptions.clear();
        
        if (this.connected) {
          this.stompClient.deactivate();
          console.log('Disconnected from WebSocket');
        }
      } catch (error) {
        console.error('Error during WebSocket disconnect:', error);
      }
    }
    
    this.connected = false;
    this.reconnectAttempts = 0;
    this.stompClient = null;
    this.notifyListeners(WebSocketEvent.DISCONNECT, null);
  }

  private subscribeToUserNotifications(userId: string): void {
    if (!this.connected || !this.stompClient) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }
    
    if (this.subscriptions.has('user')) {
      try {
        const subscription = this.subscriptions.get('user');
        if (subscription) {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('Error unsubscribing from user notifications:', error);
      }
    }
    
    try {
      const subscription = this.stompClient.subscribe(
        `/queue/notifications/${userId}`, 
        (message: IMessage) => {
          try {
            if (!message || !message.body) {
              console.error('Received empty message');
              return;
            }
            
            const notification = JSON.parse(message.body);
            
            if (!this.isValidNotification(notification)) {
              console.error('Invalid notification structure:', notification);
              return;
            }
            
            this.notifications.push(notification);
            this.notifyListeners(WebSocketEvent.NOTIFICATION, notification);
          } catch (error) {
            console.error('Error processing notification message:', error);
            console.debug('Message content:', message?.body);
          }
        },
        { ack: 'auto' } // Auto-acknowledge messages
      );
      
      this.subscriptions.set('user', subscription);
      console.log(`Subscribed to user notifications for ${userId}`);
    } catch (error) {
      console.error('Error subscribing to user notifications:', error);
      this.notifyListeners(WebSocketEvent.ERROR, { 
        message: 'Failed to subscribe to notifications' 
      });
    }
  }

  private subscribeToAdminNotifications(): void {
    if (!this.connected || !this.stompClient) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has('admin')) {
      try {
        const subscription = this.subscriptions.get('admin');
        if (subscription) {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('Error unsubscribing from admin notifications:', error);
      }
    }
    
    try {
      const subscription = this.stompClient.subscribe(
        '/topic/admin/notifications', 
        (message: IMessage) => {
          try {
            if (!message || !message.body) {
              console.error('Received empty admin message');
              return;
            }
            
            const notification = JSON.parse(message.body);
            
            // Validate notification structure
            if (!this.isValidNotification(notification)) {
              console.error('Invalid admin notification structure:', notification);
              return;
            }
            
            this.notifications.push(notification);
            this.notifyListeners(WebSocketEvent.ADMIN_NOTIFICATION, notification);
          } catch (error) {
            console.error('Error processing admin notification message:', error);
            console.debug('Admin message content:', message?.body);
          }
        },
        { ack: 'auto' }
      );
      
      this.subscriptions.set('admin', subscription);
      console.log('Subscribed to admin notifications');
    } catch (error) {
      console.error('Error subscribing to admin notifications:', error);
      this.notifyListeners(WebSocketEvent.ERROR, { 
        message: 'Failed to subscribe to admin notifications' 
      });
    }
  }

  private isValidNotification(notification: any): boolean {
    return (
      notification &&
      typeof notification === 'object' &&
      typeof notification.id === 'number' &&
      typeof notification.message === 'string' &&
      typeof notification.isRead === 'boolean' &&
      typeof notification.createdAt === 'string'
    );
  }

  public markNotificationAsRead(notificationId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.stompClient) {
        console.error('Cannot mark notification as read: WebSocket not connected');
        
        // Update local state anyway to avoid UI inconsistency
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          this.notifications[index].isRead = true;
        }
        
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      try {
        this.stompClient.publish({
          destination: `/app/notifications/read/${notificationId}`,
          headers: {},
          body: JSON.stringify({ id: notificationId })
        });
        
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          this.notifications[index].isRead = true;
        }
        
        resolve(true);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        reject(error);
      }
    });
  }

  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  public getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  public addEventListener(event: WebSocketEvent, callback: WebSocketCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  public removeEventListener(event: WebSocketEvent, callback: WebSocketCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  private notifyListeners(event: WebSocketEvent, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

const websocketServiceInstance: IWebSocketService = WebSocketService.getInstance();
export default websocketServiceInstance;