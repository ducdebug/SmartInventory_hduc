import React, { useEffect, useState, useRef } from 'react';
import { Button, Input, List, Avatar, Badge, Spin, Tooltip, Typography, Layout, Divider } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import chatService, { Message, Conversation } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { getUserId } from '../../services/authService';
import './messaging.css';

const { Content, Sider } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

const MessagingPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = getUserId();
  
  // Connect to chat service on component mount
  useEffect(() => {
    if (user && userId) {
      setLoading(true);
      
      // Connect to WebSocket
      chatService.connect(userId)
        .then(() => {
          console.log('Connected to chat service');
          
          // Register callback for new messages
          chatService.onNewMessage(handleNewMessage);
          
          // Load conversations
          loadConversations();
        })
        .catch(error => {
          console.error('Failed to connect to chat service:', error);
          // Still try to load conversations even if WebSocket fails
          loadConversations();
        });
      
      return () => {
        // Clean up on unmount
        chatService.disconnect();
      };
    }
  }, [user, userId]);
  
  // Load conversations for the current user
  const loadConversations = () => {
    if (user && userId) {
      chatService.getConversationSummaries(userId)
        .then(data => {
          setConversations(data);
          setLoading(false);
          
          // If we have conversations and none selected, select the first one
          if (data.length > 0 && !selectedContact) {
            setSelectedContact(data[0].userId);
            loadMessages(data[0].userId);
          }
        })
        .catch(error => {
          console.error('Error loading conversations:', error);
          setLoading(false);
        });
    }
  };
  
  // Load messages for a specific conversation
  const loadMessages = (contactId: string) => {
    if (user && userId) {
      setLoading(true);
      chatService.getConversation(userId, contactId)
        .then(data => {
          setMessages(data);
          setLoading(false);
          
          // Mark messages as read
          chatService.markMessagesAsRead(contactId, userId)
            .then(() => {
              // Update conversation list to reflect read messages
              loadConversations();
            })
            .catch(error => {
              console.error('Error marking messages as read:', error);
            });
          
          // Scroll to bottom of messages
          scrollToBottom();
        })
        .catch(error => {
          console.error('Error loading messages:', error);
          setLoading(false);
        });
    }
  };
  
  // Handle new incoming message
  const handleNewMessage = (message: Message) => {
    // If the message is from the currently selected contact, add it to the list
    if (selectedContact && userId && 
        ((message.senderId === selectedContact && message.receiverId === userId) || 
         (message.senderId === userId && message.receiverId === selectedContact))) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      // Mark as read if we're the receiver
      if (message.receiverId === userId) {
        chatService.markMessagesAsRead(message.senderId, userId)
          .catch(error => {
            console.error('Error marking message as read:', error);
          });
      }
    }
    
    // Refresh conversation list to show new message
    loadConversations();
  };
  
  // Select a conversation
  const selectConversation = (contactId: string) => {
    setSelectedContact(contactId);
    loadMessages(contactId);
  };
  
  // Send a message
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
        // Add the sent message to the list
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
  
  // Scroll to the bottom of the message list
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Current year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    // Different year
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
                      <Avatar icon={<UserOutlined />} />
                    </Badge>
                  }
                  title={<Text strong>{conversation.userName || conversation.userId}</Text>}
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
              <Avatar icon={<UserOutlined />} />
              <Title level={5} className="selected-contact-name">
                {conversations.find(c => c.userId === selectedContact)?.userName || selectedContact}
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
                        <div className="message-time">
                          <Tooltip title={new Date(message.timestamp || '').toLocaleString()}>
                            {formatTimestamp(message.timestamp)}
                          </Tooltip>
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

export default MessagingPage;