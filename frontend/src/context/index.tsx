import React from 'react';
import { NotificationProvider } from './NotificationContext';

// Combined provider for all app contexts
const AppContextProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
};

export default AppContextProvider;