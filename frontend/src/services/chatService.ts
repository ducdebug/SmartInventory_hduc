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

  // Connect to WebSocket for real-time messaging
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
          webSocketFactory: () => new SockJS('http://localhost:8083/ws'),
          connectHeaders: headers,
          debug: (str) => {
            console.log(str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000
        });
        
        this.stompClient.onConnect = () => {
          this.connected = true;
          console.log('Connected to Chat WebSocket');
          
          // Subscribe to personal messages
          this.subscribeToPersonalMessages(userId);
          resolve(true);
        };
        
        this.stompClient.onStompError = (frame) => {
          console.error('STOMP error:', frame);
          reject(new Error(`STOMP error: ${frame.headers['message']}`));
        };
        
        this.stompClient.onWebSocketError = (event) => {
          console.error('WebSocket error:', event);
          reject(new Error('WebSocket connection error'));
        };
        
        this.stompClient.activate();
        
      } catch (error) {
        console.error('Error setting up Chat WebSocket:', error);
        reject(error);
      }
    });
  }

  private subscribeToPersonalMessages(userId: string): void {
    if (!this.stompClient || !this.connected) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    this.stompClient.subscribe(`/user/${userId}/private`, (message) => {
      try {
        const receivedMessage = JSON.parse(message.body);
        console.log('Received message:', receivedMessage);
        this.messageCallbacks.forEach(callback => callback(receivedMessage));
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  public disconnect(): void {
    if (this.stompClient) {
      if (this.connected) {
        this.stompClient.deactivate();
        console.log('Disconnected from Chat WebSocket');
      }
      this.connected = false;
      this.stompClient = null;
    }
  }

  public sendMessage(message: Message): Promise<Message> {
    // If WebSocket is connected, send through WebSocket
    if (this.connected && this.stompClient) {
      return new Promise((resolve, reject) => {
        try {
          this.stompClient?.publish({
            destination: '/app/private-message',
            body: JSON.stringify(message)
          });
          resolve(message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          // Fallback to REST API if WebSocket fails
          this.sendMessageViaRest(message)
            .then(resolve)
            .catch(reject);
        }
      });
    } else {
      // Fallback to REST API
      return this.sendMessageViaRest(message);
    }
  }

  private sendMessageViaRest(message: Message): Promise<Message> {
    return chatApiClient.post('/chat/send-dto', message)
      .then(response => {
        console.log('Message sent via REST:', response.data);
        return response.data.data;
      })
      .catch(error => {
        console.error('Error sending message via REST:', error);
        throw error;
      });
  }

  // Get all conversation partners
  public getConversations(userId: string): Promise<string[]> {
    return chatApiClient.get(`/chat/conversations?userId=${userId}`)
      .then(response => response.data.data);
  }

  // Get detailed conversation summaries
  public getConversationSummaries(userId: string): Promise<Conversation[]> {
    return chatApiClient.get(`/chat/conversation-summaries?userId=${userId}`)
      .then(response => response.data.data);
  }

  // Get conversation history between two users
  public getConversation(senderId: string, receiverId: string): Promise<Message[]> {
    return chatApiClient.get(`/chat/conversation-dto?senderId=${senderId}&receiverId=${receiverId}`)
      .then(response => response.data.data);
  }

  // Mark messages as read
  public markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    return chatApiClient.post(`/chat/mark-read?senderId=${senderId}&receiverId=${receiverId}`)
      .then(() => {});
  }

  // Register a callback for new messages
  public onNewMessage(callback: (message: Message) => void): void {
    this.messageCallbacks.push(callback);
  }

  // Remove a callback
  public removeNewMessageCallback(callback: (message: Message) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index !== -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  // Check if WebSocket is connected
  public isConnected(): boolean {
    return this.connected;
  }
}

const chatService = ChatService.getInstance();
export default chatService;
