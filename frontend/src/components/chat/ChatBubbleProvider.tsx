import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatBubble from './ChatBubble';
import { getUserRole, getUserId } from '../../services/authService';

const ADMIN_USER_ID = 'f43739f6-b25c-4360-a38f-f8cf0fba558a';
const ADMIN_USER_NAME = 'Support Team';

const ChatBubbleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const role = getUserRole();
    const id = getUserId();
    
    console.log('ChatBubbleProvider - User info from localStorage:', { role, id, adminId: ADMIN_USER_ID });
    
    setUserRole(role);
    setUserId(id);
  }, [location.pathname]);

  const shouldShowChatBubble = () => {
    if (!userRole || !userId) return false;
    
    const normalizedRole = userRole.toUpperCase();
    return (normalizedRole === 'SUPPLIER' || 
            normalizedRole === 'BUYER' || 
            normalizedRole === 'ROLE_SUPPLIER' || 
            normalizedRole === 'ROLE_BUYER') &&
           userId !== ADMIN_USER_ID; // Don't show chat bubble for admin
  };

  return (
    <>
      {children}
      {shouldShowChatBubble() && (
        <ChatBubble 
          adminId={ADMIN_USER_ID} 
          adminName={ADMIN_USER_NAME} 
        />
      )}
    </>
  );
};

export default ChatBubbleProvider;
