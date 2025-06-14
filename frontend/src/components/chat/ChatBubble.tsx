import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button, Drawer, Input, List, Avatar, Spin, Typography, Space } from 'antd';
import { MessageOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import chatService, { Message } from '../../services/chatService';
import { getUserInfo, getUserId, getUserRole, User } from '../../services/authService';
import { formatTimeAgo } from '../../utils/dateUtils';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatBubbleProps {
  adminId: string; 
  adminName?: string; 
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  adminId, 
  adminName = "Admin Support" 
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get user info from localStorage
  const currentUser: User | null = getUserInfo();
  const currentUserId = getUserId();
  const userRole = getUserRole();
  
  console.log('ChatBubble - Current user from localStorage:', { 
    user: currentUser, 
    userId: currentUserId, 
    role: userRole,
    adminId
  });
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) {
      console.log('ChatBubble - No user ID found in localStorage');
      return;
    }
    
    const connectAndLoadMessages = async () => {
      try {
        if (!chatService.isConnected()) {
          await chatService.connect(currentUserId);
        }
        
        loadMessageHistory();
        
        chatService.onNewMessage(handleNewMessage);
      } catch (error) {
        console.error('Error connecting to chat service:', error);
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
    return () => clearInterval(intervalId);
  }, [currentUserId]);

  const updateUnreadCount = async () => {
    if (!currentUserId) return;
    
    try {
      const summaries = await chatService.getConversationSummaries();
      const adminConversation = summaries.find(conv => conv.userId === adminId);
      setUnreadCount(adminConversation?.unreadCount || 0);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const loadMessageHistory = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const history = await chatService.getConversation(adminId);
      setMessages(history);
      
      if (visible) {
        await chatService.markMessagesAsRead(adminId);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading message history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    if ((message.senderId === adminId && message.receiverId === currentUserId) || 
        (message.senderId === currentUserId && message.receiverId === adminId)) {
      
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      
      if (!visible && message.senderId === adminId) {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showDrawer = async () => {
    setVisible(true);
    
    if (currentUserId && unreadCount > 0) {
      try {
        await chatService.markMessagesAsRead(adminId);
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const onClose = () => {
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
      await chatService.sendMessage(message);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return formatTimeAgo(timestamp);
  };

  const isOwnMessage = (senderId: string) => {
    return senderId === currentUserId;
  };

  return (
    <>
      <Badge count={unreadCount} overflowCount={99}>
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          size="large"
          onClick={showDrawer}
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

      <Drawer
        title={
          <Space>
            <Avatar style={{ backgroundColor: '#1890ff' }}>{adminName[0]}</Avatar>
            <Text strong>{adminName}</Text>
          </Space>
        }
        placement="right"
        closable={true}
        onClose={onClose}
        closeIcon={<CloseOutlined />}
        open={visible}
        width={350}
        bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100% - 55px)' }}
      >
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <List
              dataSource={messages}
              renderItem={(item: Message) => {
                const isOwn = isOwnMessage(item.senderId);
                return (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: isOwn ? '#1890ff' : '#f0f2f5',
                          color: isOwn ? 'white' : 'rgba(0, 0, 0, 0.65)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          maxWidth: '70%',
                          wordWrap: 'break-word'
                        }}
                      >
                        {item.content}
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                        {formatTime(item.timestamp)} | Sender: {item.senderId} | Own: {isOwn.toString()}
                      </Text>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            padding: '16px',
            backgroundColor: '#fff'
          }}
        >
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!newMessage.trim()}
            />
          </Space.Compact>
        </div>
      </Drawer>
    </>
  );
};

export default ChatBubble;