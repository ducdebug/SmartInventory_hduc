import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ModernChatBubble from './ModernChatBubble';
import { getUserRole, getUserInfo, getUserId } from '../../services/authService';

const ADMIN_USER_ID = '37e4db5d-7ad4-4120-99d8-19f38ec6d8c1';
const ADMIN_USER_NAME = 'Support Team';

const ChatBubbleWrapper: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const role = getUserRole();
    const user = getUserInfo();
    const id = getUserId();
    
    console.log('ChatBubbleWrapper - User info from localStorage:', { 
      role, 
      user, 
      userId: id,
      adminId: ADMIN_USER_ID 
    });
    
    setUserRole(role);
    setUserId(id);
  }, [location.pathname]); 

  const isSupplierOrBuyer = () => {
    if (!userRole) return false;
    
    const normalizedRole = userRole.toUpperCase();
    return normalizedRole.includes('SUPPLIER') || 
           normalizedRole.includes('BUYER') ||
           normalizedRole === 'ROLE_SUPPLIER' ||
           normalizedRole === 'ROLE_BUYER';
  };
  
  const shouldShowChatBubble = () => {
    return isSupplierOrBuyer() && 
           userId !== ADMIN_USER_ID && // Don't show for admin
           !['/login', '/register'].includes(location.pathname);
  };

  return shouldShowChatBubble() ? (
    <ModernChatBubble 
      adminId={ADMIN_USER_ID} 
      adminName={ADMIN_USER_NAME} 
    />
  ) : null;
};

export default ChatBubbleWrapper;
