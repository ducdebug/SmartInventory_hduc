import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getImageDisplayUrl } from '../services/userService';

interface ProfileImageContextType {
  profileImageUrl: string | null;
  updateProfileImage: (newImageUrl: string) => void;
  clearProfileImage: () => void;
  resetProfileImageFromStorage: () => void;
}

const ProfileImageContext = createContext<ProfileImageContextType | undefined>(undefined);

export const ProfileImageProvider = ({ children }: { children: ReactNode }) => {
  const getUserImageFromStorage = (): string | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.img_url) {
          return user.img_url;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(getUserImageFromStorage());

  useEffect(() => {
    const handleStorageChange = () => {
      setProfileImageUrl(getUserImageFromStorage());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateProfileImage = (newImageUrl: string) => {
    setProfileImageUrl(newImageUrl);
    
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user) {
          user.img_url = newImageUrl;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch (error) {
    }
  };

  const clearProfileImage = () => {
    setProfileImageUrl(null);
  };

  const resetProfileImageFromStorage = () => {
    setProfileImageUrl(getUserImageFromStorage());
  };

  return (
    <ProfileImageContext.Provider value={{ 
      profileImageUrl, 
      updateProfileImage, 
      clearProfileImage,
      resetProfileImageFromStorage 
    }}>
      {children}
    </ProfileImageContext.Provider>
  );
};

export const useProfileImage = (): ProfileImageContextType => {
  const context = useContext(ProfileImageContext);
  if (context === undefined) {
    throw new Error('useProfileImage must be used within a ProfileImageProvider');
  }
  return context;
};