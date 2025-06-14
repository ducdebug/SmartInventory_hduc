import React, { useEffect, useState, useRef } from 'react';
import { Button, Input, List, Avatar, Badge, Spin, Tooltip, Typography, Layout, Divider } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import chatService, { Message, Conversation } from '../../services/chatService';
import authApiClient from '../../utils/authApiClient';
import { useAuth } from '../../hooks/useAuth';
import { getUserId } from '../../services/authService';
import './messaging.css';

const { Content, Sider } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface UserInfo {
  id: string;
  username: string;
  role: string;
  img_url?: string;
}

const MessagePage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [userCache, setUserCache] = useState<Record<string, UserInfo>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = getUserId();

  const fetchUserInfo = async (userId: string): Promise<UserInfo | null> => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const token = localStorage.getItem('authToken');
      const currentUserId = localStorage.getItem('userId');
      
      if (!token) {
        console.error('No auth token available');
        return null;
      }
      
      const response = await authApiClient.get(`/auth/user/${userId}`);
      const userInfo: UserInfo = response.data;
      
      setUserCache(prev => ({
        ...prev,
        [userId]: userInfo
      }));
      
      return userInfo;
    } catch (error: any) {
      console.error('Error fetching user info for ID:', userId, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        headers: error.config?.headers
      });
      
      // If it's a 403, it might be a permission issue
      if (error.response?.status === 403) {
        console.error('403 Forbidden - User may not have permission to access this user info');
      }
      
      return null;
    }
  };

  // Get display name for a user ID
  const getDisplayName = (userId: string): string => {
    const userInfo = userCache[userId];
    if (userInfo) {
      return userInfo.username || userId;
    }
    return userId; // Fallback to ID if username not available
  };

  // Enhanced conversation loading with username fetching
  const loadConversationsWithUsernames = async () => {
    try {
      const data = await chatService.getConversationSummaries();

      
      // Fetch user info for all conversation participants
      const userPromises = data.map(conv => fetchUserInfo(conv.userId));
      await Promise.all(userPromises);
      
      // Update conversations with usernames
      const enhancedConversations = data.map(conv => ({
        ...conv,
        userName: getDisplayName(conv.userId)
      }));
      
      setConversations(enhancedConversations);
      setLoading(false);
      
      if (enhancedConversations.length > 0 && !selectedContact) {
        setSelectedContact(enhancedConversations[0].userId);
        loadMessages(enhancedConversations[0].userId);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && userId) {
      setLoading(true);
      
      chatService.connect(userId)
        .then(() => {
          chatService.onNewMessage(handleNewMessage);
          loadConversationsWithUsernames();
        })
        .catch(error => {
          console.error('Failed to connect to chat service:', error);
          loadConversationsWithUsernames();
        });
      
      return () => {
        chatService.disconnect();
      };
    }
  }, [user, userId]);
  
  const loadConversations = () => {
    loadConversationsWithUsernames();
  };
  
  const loadMessages = async (contactId: string) => {
    if (user && userId) {
      setLoading(true);
      try {
        const data = await chatService.getConversation(contactId);
        
        // Fetch user info for message senders/receivers if not already cached
        const userIds = new Set<string>();
        data.forEach(message => {
          if (message.senderId) userIds.add(message.senderId);
          if (message.receiverId) userIds.add(message.receiverId);
        });
        
        // Fetch user info for any uncached users
        const uncachedUsers = Array.from(userIds).filter(id => !userCache[id]);
        if (uncachedUsers.length > 0) {
          const userPromises = uncachedUsers.map(id => fetchUserInfo(id));
          await Promise.all(userPromises);
        }
        
        // Enhance messages with usernames
        const enhancedMessages = data.map(message => ({
          ...message,
          senderName: getDisplayName(message.senderId),
          receiverName: getDisplayName(message.receiverId)
        }));
        
        setMessages(enhancedMessages);
        setLoading(false);
        scrollToBottom();
      } catch (error) {
        console.error('Error loading messages:', error);
        setLoading(false);
      }
    }
  };
  
  const handleNewMessage = async (message: Message) => {
    // Fetch sender info if not cached
    if (message.senderId && !userCache[message.senderId]) {
      await fetchUserInfo(message.senderId);
    }
    
    // Enhance message with username
    const enhancedMessage = {
      ...message,
      senderName: getDisplayName(message.senderId),
      receiverName: getDisplayName(message.receiverId)
    };
    
    if (selectedContact && userId && 
        ((message.senderId === selectedContact && message.receiverId === userId) || 
         (message.senderId === userId && message.receiverId === selectedContact))) {
      setMessages(prev => [...prev, enhancedMessage]);
      scrollToBottom();
    }
    
    loadConversationsWithUsernames();
  };
  
  const selectConversation = (contactId: string) => {
    setSelectedContact(contactId);
    loadMessages(contactId);
  };
  
  const sendMessage = () => {
    if (!messageInput.trim() || !selectedContact || !userId) {
      return;
    }
    
    const newMessage: Message = {
      senderId: userId,
      receiverId: selectedContact,
      content: messageInput.trim(),
      timestamp: new Date().toISOString()
    };
    
    setSendingMessage(true);
    chatService.sendMessage(newMessage)
      .then(sentMessage => {
        setMessages(prev => [...prev, sentMessage]);
        setMessageInput('');
        scrollToBottom();
      })
      .catch(error => {
        console.error('Error sending message:', error);
      })
      .finally(() => {
        setSendingMessage(false);
      });
  };
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  return (
    <Layout className="messaging-layout">
      <Sider
        width={300}
        theme="light"
        className="conversation-sider"
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div className="conversations-header">
          <Title level={4}>Conversations</Title>
        </div>
        
        {loading && conversations.length === 0 ? (
          <div className="loading-container">
            <Spin />
          </div>
        ) : (
          <List
            className="conversation-list"
            dataSource={conversations}
            renderItem={(conversation: Conversation) => (
              <List.Item
                className={`conversation-item ${selectedContact === conversation.userId ? 'selected' : ''}`}
                onClick={() => selectConversation(conversation.userId)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={conversation.unreadCount} size="small">
                      <Avatar 
                        icon={<UserOutlined />}
                        src={userCache[conversation.userId]?.img_url}
                      />
                    </Badge>
                  }
                  title={<Text strong>{getDisplayName(conversation.userId)}</Text>}
                  description={
                    <div className="conversation-preview">
                      <Text ellipsis className="conversation-last-message">
                        {conversation.lastMessage || 'No messages yet'}
                      </Text>
                      {conversation.lastMessageTime && (
                        <Text type="secondary" className="conversation-time">
                          {formatTimestamp(conversation.lastMessageTime)}
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Sider>
      
      <Content className="messages-content">
        {selectedContact ? (
          <>
            <div className="messages-header">
              <Avatar 
                icon={<UserOutlined />}
                src={userCache[selectedContact]?.img_url}
              />
              <Title level={5} className="selected-contact-name">
                {getDisplayName(selectedContact)}
              </Title>
            </div>
            
            <Divider className="messages-divider" />
            
            <div className="messages-container">
              {loading ? (
                <div className="loading-container">
                  <Spin />
                </div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <Text type="secondary">No messages yet. Start the conversation!</Text>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`message-item ${message.senderId === userId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-info">
                          <span className="message-sender">
                            {message.senderId === userId ? 'You' : getDisplayName(message.senderId)}
                          </span>
                          <div className="message-time">
                            <Tooltip title={new Date(message.timestamp || '').toLocaleString()}>
                              {formatTimestamp(message.timestamp)}
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className="message-input-container">
              <TextArea
                value={messageInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={sendingMessage}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
                loading={sendingMessage}
                disabled={!messageInput.trim()}
              >
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <Text type="secondary">Select a conversation to start messaging</Text>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default MessagePage;
