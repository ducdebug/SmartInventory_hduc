import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatBubble from './ChatBubble';
import { getUserRole } from '../../services/authService';

// Configuration for admin user ID
const ADMIN_USER_ID = 'admin';
const ADMIN_USER_NAME = 'Support Team';

const ChatBubbleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
  }, [location.pathname]); // Re-check role on route change

  // Only show chat bubble for supplier and buyer roles
  const shouldShowChatBubble = userRole === 'SUPPLIER' || userRole === 'BUYER';

  return (
    <>
      {children}
      {shouldShowChatBubble && (
        <ChatBubble 
          adminId={ADMIN_USER_ID} 
          adminName={ADMIN_USER_NAME} 
        />
      )}
    </>
  );
};

export default ChatBubbleProvider;
