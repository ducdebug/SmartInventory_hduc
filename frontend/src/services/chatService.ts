import chatApiClient from '../utils/chatApiClient';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAuthToken } from './authService';

export interface Message {
  id?: number;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: string;
  read?: boolean;
  senderName?: string;
  receiverName?: string;
}

export interface Conversation {
  userId: string;
  userName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

class ChatService {
  private static instance: ChatService;
  private stompClient: Client | null = null;
  private connected: boolean = false;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private userId: string = '';

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
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
          webSocketFactory: () => new SockJS('http://localhost:8083/api/ws'),
          connectHeaders: headers,
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000
        });
        
        this.stompClient.onConnect = () => {
          this.connected = true;
          this.subscribeToPersonalMessages(userId);
          resolve(true);
        };
        
        this.stompClient.onStompError = (frame) => {
          reject(new Error(`STOMP error: ${frame.headers['message']}`));
        };
        
        this.stompClient.onWebSocketError = (event) => {
          reject(new Error('WebSocket connection error'));
        };
        
        this.stompClient.onWebSocketClose = (event) => {
          this.connected = false;
        };
        
        this.stompClient.activate();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private subscribeToPersonalMessages(userId: string): void {
    if (!this.stompClient || !this.connected) {
      return;
    }

    this.stompClient.subscribe(`/user/${userId}/private`, (message) => {
      try {
        const receivedMessage = JSON.parse(message.body);
        console.log('ChatService - Received WebSocket message:', receivedMessage);
        
        // Trigger all callbacks
        this.messageCallbacks.forEach(callback => {
          try {
            callback(receivedMessage);
          } catch (error) {
            console.error('Error in message callback:', error);
          }
        });
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
  }

  public disconnect(): void {
    if (this.stompClient) {
      if (this.connected) {
        this.stompClient.deactivate();
      }
      this.connected = false;
      this.stompClient = null;
    }
  }

  public sendMessage(message: Message): Promise<Message> {
    if (this.connected && this.stompClient) {
      return new Promise((resolve, reject) => {
        try {
          this.stompClient?.publish({
            destination: '/app/private-message',
            body: JSON.stringify(message)
          });
          
          // For WebSocket sends, we should get the response via the callback
          // But let's also try REST as fallback
          this.sendMessageViaRest(message)
            .then(resolve)
            .catch(() => {
              // If REST also fails, still resolve with the original message
              resolve(message);
            });
            
        } catch (error) {
          this.sendMessageViaRest(message)
            .then(resolve)
            .catch(reject);
        }
      });
    } else {
      return this.sendMessageViaRest(message);
    }
  }

  private sendMessageViaRest(message: Message): Promise<Message> {
    return chatApiClient.post('/chat/send-dto', message)
      .then(response => {
        const sentMessage = response.data.data;
        
        this.messageCallbacks.forEach(callback => {
          try {
            callback(sentMessage);
          } catch (error) {
            // Silent fail
          }
        });
        
        return sentMessage;
      })
      .catch(error => {
        throw error;
      });
  }

  public getConversationSummaries(): Promise<Conversation[]> {
    return chatApiClient.get('/chat/conversation-summaries')
      .then(response => response.data.data)
      .catch(error => {
        throw error;
      });
  }

  public getConversation(receiverId: string): Promise<Message[]> {
    return chatApiClient.get(`/chat/conversation-dto?receiverId=${receiverId}`)
      .then(response => response.data.data)
      .catch(error => {
        throw error;
      });
  }

  public markMessagesAsRead(senderId: string): Promise<void> {
    return chatApiClient.post(`/chat/mark-messages-read?senderId=${senderId}`)
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }

  public onNewMessage(callback: (message: Message) => void): void {
    this.messageCallbacks.push(callback);
  }

  public removeNewMessageCallback(callback: (message: Message) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index !== -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

const chatService = ChatService.getInstance();
export default chatService;
