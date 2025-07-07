import { getAuthToken } from './authService';
import SockJS from 'sockjs-client';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';

export interface Notification {
  id: number;
  userId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  relatedId?: string;
  imgUrl?: string;
  title?: string;
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
  private reconnectInterval: number = 5000;
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
      this.establishWebSocketConnection(userId, resolve, reject);
    });
  }

  private establishWebSocketConnection(userId: string, resolve: (value: boolean) => void, reject: (reason?: any) => void): void {
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
      
      headers['X-User-ID'] = userId;
      
      this.stompClient = new Client({
        webSocketFactory: () => {
          const socketUrl = `http://localhost:8083/ws?userId=${encodeURIComponent(userId)}`;
          return new SockJS(socketUrl);
        },
        connectHeaders: headers,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000
      });
      
      this.stompClient.onConnect = (frame: IFrame) => {
        this.connected = true;
        this.reconnectAttempts = 0;
        
        this.subscribeToUserNotifications(userId);
        if (userId === 'admin' || localStorage.getItem('userRole') === 'ADMIN') {
          this.subscribeToAdminNotifications();
        }
        
        this.notifyListeners(WebSocketEvent.CONNECT, frame);
        resolve(true);
      };
      
      this.stompClient.onStompError = (frame: IFrame) => {
        this.notifyListeners(WebSocketEvent.ERROR, frame);
        reject(new Error(`STOMP error: ${frame.headers['message'] || 'Unknown STOMP error'}`));
      };
      
      this.stompClient.onWebSocketError = (event: Event) => {
        this.notifyListeners(WebSocketEvent.ERROR, event);
        this.attemptReconnect();
        reject(new Error('WebSocket connection error. Please check if the notification service is running.'));
      };
      
      this.stompClient.onWebSocketClose = () => {
        if (this.connected) {
          this.connected = false;
          this.notifyListeners(WebSocketEvent.DISCONNECT, null);
          this.attemptReconnect();
        }
      };
      
      this.stompClient.activate();
      
    } catch (error) {
      reject(error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const backoffInterval = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.userId).catch(() => {});
      }, backoffInterval);
    } else {
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
          } catch (error) {}
        });
        this.subscriptions.clear();
        
        if (this.connected) {
          this.stompClient.deactivate();
        }
      } catch (error) {}
    }
    
    this.connected = false;
    this.reconnectAttempts = 0;
    this.stompClient = null;
    this.notifyListeners(WebSocketEvent.DISCONNECT, null);
  }

  private subscribeToUserNotifications(userId: string): void {
    if (!this.connected || !this.stompClient) {
      return;
    }
    
    if (this.subscriptions.has('user')) {
      try {
        const subscription = this.subscriptions.get('user');
        if (subscription) {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Error unsubscribing from previous user subscription:', error);
      }
    }
    
    try {
      const subscription = this.stompClient.subscribe(
        `/user/queue/notifications`, 
        (message: IMessage) => {
          try {
            if (!message || !message.body) {
              return;
            }
            
            const notification = JSON.parse(message.body);
            
            if (!this.isValidNotification(notification)) {
              return;
            }
            
            this.notifications.push(notification);
            this.notifyListeners(WebSocketEvent.NOTIFICATION, notification);
            
          } catch (error) {
            console.error('Error processing notification message:', error);
          }
        },
        { ack: 'auto' }
      );
      
      this.subscriptions.set('user', subscription);
      
    } catch (error) {
      console.error('Failed to subscribe to user notifications:', error);
      this.notifyListeners(WebSocketEvent.ERROR, { 
        message: 'Failed to subscribe to notifications' 
      });
    }
  }

  private subscribeToAdminNotifications(): void {
    if (!this.connected || !this.stompClient) {
      return;
    }
    
    if (this.subscriptions.has('admin')) {
      try {
        const subscription = this.subscriptions.get('admin');
        if (subscription) {
          subscription.unsubscribe();
        }
      } catch (error) {}
    }
    
    try {
      const subscription = this.stompClient.subscribe(
        '/topic/admin/notifications', 
        (message: IMessage) => {
          try {
            if (!message || !message.body) {
              return;
            }
            
            const notification = JSON.parse(message.body);
            
            if (!this.isValidNotification(notification)) {
              return;
            }
            
            this.notifications.push(notification);
            this.notifyListeners(WebSocketEvent.ADMIN_NOTIFICATION, notification);
          } catch (error) {}
        },
        { ack: 'auto' }
      );
      
      this.subscriptions.set('admin', subscription);
    } catch (error) {
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
      typeof notification.content === 'string' &&
      typeof notification.isRead === 'boolean' &&
      typeof notification.createdAt === 'string'
    );
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
      } catch (error) {}
    });
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

const websocketServiceInstance: IWebSocketService = WebSocketService.getInstance();
export default websocketServiceInstance;
