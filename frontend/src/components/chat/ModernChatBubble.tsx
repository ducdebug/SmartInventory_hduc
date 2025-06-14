import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button, Input, List, Avatar, Spin, Typography, Space, Tooltip } from 'antd';
import { 
  MessageOutlined, 
  SendOutlined, 
  CloseOutlined, 
  SmileOutlined, 
  PaperClipOutlined
} from '@ant-design/icons';
import chatService, { Message } from '../../services/chatService';
import { getUserInfo, getUserId, getUserRole, User } from '../../services/authService';
import { formatDateString, formatTimeAgo } from '../../utils/dateUtils';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChatBubbleProps {
  adminId: string; 
  adminName?: string; 
}

const ModernChatBubble: React.FC<ChatBubbleProps> = ({ 
  adminId, 
  adminName = "Admin Support" 
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<any>(null);
  
  // Get user info from localStorage
  const currentUser: User | null = getUserInfo();
  const currentUserId = getUserId();
  const userRole = getUserRole();
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    
    const connectAndLoadMessages = async () => {
      try {
        if (!chatService.isConnected()) {
          await chatService.connect(currentUserId);
        }
        
        await loadMessageHistory();
        
        chatService.onNewMessage(handleNewMessage);
      } catch (error) {
        try {
          await loadMessageHistory();
        } catch (restError) {
          // Silent fail
        }
      }
    };
    
    connectAndLoadMessages();
    
    return () => {
      chatService.removeNewMessageCallback(handleNewMessage);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    
    updateUnreadCount();
    
    const intervalId = setInterval(updateUnreadCount, 30000); 
    
    const messageRefreshId = setInterval(() => {
      if (visible && !isMinimized) {
        loadMessageHistory();
      }
    }, 10000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(messageRefreshId);
    };
  }, [currentUserId, visible, isMinimized]);

  const updateUnreadCount = async () => {
    if (!currentUserId) return;
    
    try {
      const summaries = await chatService.getConversationSummaries();
      const adminConversation = summaries.find(conv => conv.userId === adminId);
      setUnreadCount(adminConversation?.unreadCount || 0);
    } catch (error) {
      // Silent fail
    }
  };

  const loadMessageHistory = async () => {
    if (!currentUserId) {
      return;
    }
    
    setLoading(true);
    try {
      const history = await chatService.getConversation(adminId);
      setMessages(history);
      
      if (visible && !isMinimized) {
        await chatService.markMessagesAsRead(adminId);
        setUnreadCount(0);
      }
    } catch (error) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    if ((message.senderId === adminId && message.receiverId === currentUserId) || 
        (message.senderId === currentUserId && message.receiverId === adminId)) {
      
      setMessages(prev => {
        const exists = prev.some(m => 
          (m.id && m.id === message.id) || 
          (m.content === message.content && m.timestamp === message.timestamp && m.senderId === message.senderId)
        );
        
        if (exists) {
          return prev;
        }
        
        const newMessages = [...prev, message];
        setForceUpdate(Date.now());
        return newMessages;
      });
      
      if ((isMinimized || !visible) && message.senderId === adminId) {
        setUnreadCount(prev => prev + 1);
      }
      
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChatWindow = async () => {
    if (!visible || isMinimized) {
      setVisible(true);
      setIsMinimized(false);
      
      if (currentUserId && unreadCount > 0) {
        try {
          await chatService.markMessagesAsRead(adminId);
          setUnreadCount(0);
        } catch (error) {
          // Silent fail
        }
      }
      
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    } else {
      setIsMinimized(true);
    }
  };

  const closeChatWindow = () => {
    setVisible(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    
    const message: Message = {
      senderId: currentUserId,
      receiverId: adminId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      senderName: currentUser?.username || currentUserId,
      receiverName: adminName
    };
    
    try {
      setNewMessage('');
      
      const sentMessage = await chatService.sendMessage(message);
      
      if (!chatService.isConnected()) {
        setMessages(prev => {
          const exists = prev.some(m => 
            (m.id && m.id === sentMessage.id) || 
            (m.content === sentMessage.content && m.timestamp === sentMessage.timestamp && m.senderId === sentMessage.senderId)
          );
          
          if (!exists) {
            return [...prev, sentMessage];
          }
          return prev;
        });
        
        setForceUpdate(Date.now());
      }
      
      messageInputRef.current?.focus();
      
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      
    } catch (error) {
      setNewMessage(message.content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format message timestamp
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return formatTimeAgo(timestamp);
  };

  // Determine if a message is from the current user
  const isOwnMessage = (senderId: string) => {
    return senderId === currentUserId;
  };

  // Group messages by date for better display
  const getMessageGroups = () => {
    const groups: { date: string, messages: Message[] }[] = [];
    
    messages.forEach(message => {
      if (!message.timestamp) return;
      
      const messageDate = message.timestamp.split('T')[0]; // YYYY-MM-DD
      const existingGroup = groups.find(g => g.date === messageDate);
      
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message]
        });
      }
    });
    
    return groups;
  };

  const formatDateHeader = (dateStr: string) => {
    return formatDateString(dateStr);
  };

  const showEmoji = () => {
    // Emoji picker implementation would go here
  };

  // Render the chat bubble with the improved UI
  return (
    <>
      {/* Floating Chat Button */}
      <Badge count={unreadCount} overflowCount={99}>
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          size="large"
          onClick={toggleChatWindow}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            boxShadow: '0 6px 16px -8px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}
        />
      </Badge>

      {/* Chat Window */}
      {visible && (
        <div
          key={`chat-window-${forceUpdate}`}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: isMinimized ? '300px' : '350px',
            height: isMinimized ? 'auto' : '500px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: isMinimized ? 'pointer' : 'default',
            }}
            onClick={isMinimized ? toggleChatWindow : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                style={{ 
                  backgroundColor: '#fff', 
                  color: '#1890ff',
                  marginRight: '8px'
                }}
              >
                {adminName[0]}
              </Avatar>
              <Title 
                level={5} 
                style={{ 
                  margin: 0, 
                  color: '#fff' 
                }}
              >
                {adminName}
              </Title>
            </div>
            <div>
              {!isMinimized && (
                <>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    style={{ color: '#fff' }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setIsMinimized(true);
                    }}
                  />
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    style={{ color: '#fff' }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      closeChatWindow();
                    }}
                  />
                </>
              )}
              {isMinimized && (
                <Badge count={unreadCount} overflowCount={99} />
              )}
            </div>
          </div>

          {/* Chat Content - Only show when not minimized */}
          {!isMinimized && (
            <>
              {/* Messages List */}
              <div 
                style={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  padding: '16px',
                  backgroundColor: '#f5f7f9'
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    flexDirection: 'column', 
                    color: '#999',
                    textAlign: 'center',
                    padding: '0 20px'
                  }}>
                    <MessageOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                    <Text>No messages yet. Start a conversation with {adminName}!</Text>
                  </div>
                ) : (
                  getMessageGroups().map(group => (
                    <div key={group.date}>
                      <div style={{ 
                        textAlign: 'center', 
                        margin: '16px 0 8px', 
                        position: 'relative' 
                      }}>
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: 0, 
                          right: 0, 
                          height: '1px', 
                          backgroundColor: '#e8e8e8', 
                          zIndex: 1 
                        }} />
                        <Text 
                          type="secondary" 
                          style={{ 
                            position: 'relative', 
                            zIndex: 2, 
                            backgroundColor: '#f5f7f9', 
                            padding: '0 12px',
                            fontSize: '12px' 
                          }}
                        >
                          {formatDateHeader(group.date)}
                        </Text>
                      </div>
                      
                      {group.messages.map((item: Message, index: number) => {
                        const isOwn = isOwnMessage(item.senderId);
                        
                        return (
                          <div
                            key={`${item.id || index}-${item.timestamp}-${forceUpdate}`}
                            style={{
                              marginBottom: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isOwn ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: isOwn ? '#1890ff' : '#fff',
                                color: isOwn ? 'white' : 'rgba(0, 0, 0, 0.85)',
                                borderRadius: '18px',
                                padding: '10px 16px',
                                maxWidth: '80%',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                wordWrap: 'break-word'
                              }}
                            >
                              {item.content}
                            </div>
                            <Text 
                              type="secondary" 
                              style={{ 
                                fontSize: '11px', 
                                marginTop: '4px',
                                padding: '0 8px'
                              }}
                            >
                              {formatTime(item.timestamp)}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div
                style={{
                  borderTop: '1px solid #f0f0f0',
                  padding: '12px 16px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <TextArea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ 
                      flex: 1, 
                      padding: '8px 12px',
                      borderRadius: '18px',
                      resize: 'none',
                      marginRight: '8px'
                    }}
                    bordered
                  />
                  <div>
                    <Tooltip title="Send message">
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        style={{ marginLeft: '4px' }}
                      />
                    </Tooltip>
                  </div>
                </div>
                
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: '8px'
                  }}
                >
                  <div>
                    <Tooltip title="Add emoji (coming soon)">
                      <Button 
                        type="text" 
                        icon={<SmileOutlined />} 
                        size="small"
                        onClick={showEmoji}
                      />
                    </Tooltip>
                    <Tooltip title="Attach file (coming soon)">
                      <Button 
                        type="text" 
                        icon={<PaperClipOutlined />} 
                        size="small"
                        disabled
                      />
                    </Tooltip>
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Press Enter to send
                  </Text>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ModernChatBubble;