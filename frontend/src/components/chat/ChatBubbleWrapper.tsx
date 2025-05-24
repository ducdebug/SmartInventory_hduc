import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ModernChatBubble from './ModernChatBubble';
import { getUserRole, getUserInfo } from '../../services/authService';

const ADMIN_USER_ID = 'admin';
const ADMIN_USER_NAME = 'Support Team';

const ChatBubbleWrapper: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const role = getUserRole();
    const user = getUserInfo();
    
    console.log('ChatBubbleWrapper - Current user role:', role);
    console.log('ChatBubbleWrapper - Current user:', user);
    
    setUserRole(role);
  }, [location.pathname]); 

  const isSupplierOrBuyer = () => {
    if (!userRole) return false;
    
    const normalizedRole = userRole.toUpperCase();
    return normalizedRole.includes('SUPPLIER') || 
           normalizedRole.includes('BUYER') ||
           normalizedRole === 'ROLE_SUPPLIER' ||
           normalizedRole === 'ROLE_BUYER';
  };
  
  const shouldShowChatBubble = isSupplierOrBuyer() && 
    !['/login', '/register'].includes(location.pathname);
  
  console.log('ChatBubbleWrapper - Should show chat bubble:', shouldShowChatBubble);

  return shouldShowChatBubble ? (
    <ModernChatBubble 
      adminId={ADMIN_USER_ID} 
      adminName={ADMIN_USER_NAME} 
    />
  ) : null;
};

export default ChatBubbleWrapper;
