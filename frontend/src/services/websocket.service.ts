import { getAuthToken } from './auth.service';
import SockJS from 'sockjs-client';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';

// Types for notification system
export interface Notification {
  id: number;
  toUserId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// WebSocket events that components can subscribe to
export enum WebSocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  NOTIFICATION = 'notification',
  ADMIN_NOTIFICATION = 'admin_notification',
  ERROR = 'error'
}

export type WebSocketCallback = (data: any) => void;

// Creating an interface that will be implemented by WebSocketService
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
    // Initialize event listener maps
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

  /**
   * Connect to the WebSocket server
   * @param userId The ID of the user to connect as
   */
  public connect(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.stompClient) {
        this.disconnect();
      }

      this.userId = userId;
      
      try {
        // Get the authorization token
        const token = getAuthToken();
        const headers: { [key: string]: string } = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Create Stomp client
        this.stompClient = new Client({
          webSocketFactory: () => new SockJS('/ws'),
          connectHeaders: headers,
          debug: (str) => {
            // Disable debug logs in production
            // console.log(str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000
        });
        
        // Set up event handlers
        this.stompClient.onConnect = (frame: IFrame) => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('Connected to WebSocket');
          
          // Subscribe to user-specific notifications
          this.subscribeToUserNotifications(userId);
          
          // If user is admin, subscribe to admin notifications as well
          if (userId === 'admin' || localStorage.getItem('userRole') === 'ADMIN') {
            this.subscribeToAdminNotifications();
          }
          
          // Notify all listeners about the connection
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
        
        // Activate the client (initiate connection)
        this.stompClient.activate();
        
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Use exponential backoff for reconnection attempts
      const backoffInterval = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${backoffInterval/1000}s...`);
      
      this.reconnectTimeout = setTimeout(() => {
        // Check if token has expired and refresh if needed
        const token = getAuthToken();
        if (!token) {
          console.warn('Authorization token not available for reconnection');
          // Still attempt to connect but may fail due to auth
        }
        
        this.connect(this.userId).catch((error) => {
          console.warn('Reconnection attempt failed:', error);
          // The error is already handled in connect method
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

  /**
   * Subscribe to admin notifications
   */
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
      // Subscribe to admin topic
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
        { ack: 'auto' } // Auto-acknowledge messages
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
  
  /**
   * Validate notification structure
   * @param notification The notification to validate
   * @returns True if valid, false otherwise
   */
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

  /**
   * Mark a notification as read
   * @param notificationId The ID of the notification to mark as read
   * @returns Promise that resolves when the notification is marked as read
   */
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
        // Send request to mark notification as read
        this.stompClient.publish({
          destination: `/app/notifications/read/${notificationId}`,
          headers: {},
          body: JSON.stringify({ id: notificationId })
        });
        
        // Update local notifications
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

  /**
   * Get all notifications
   * @returns An array of all notifications
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   * @returns An array of unread notifications
   */
  public getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  /**
   * Add an event listener
   * @param event The event to listen for
   * @param callback The callback to call when the event occurs
   */
  public addEventListener(event: WebSocketEvent, callback: WebSocketCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Remove an event listener
   * @param event The event to remove the listener from
   * @param callback The callback to remove
   */
  public removeEventListener(event: WebSocketEvent, callback: WebSocketCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  /**
   * Notify all listeners about an event
   * @param event The event that occurred
   * @param data The data to pass to the listeners
   */
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

  /**
   * Check if the WebSocket is connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connected;
  }
}

// Export a properly typed instance of the WebSocketService
const websocketServiceInstance: IWebSocketService = WebSocketService.getInstance();
export default websocketServiceInstance;