import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as AuthUser, LoginCredentials, RegisterData } from "../types/auth";
import authService, { User as ServiceUser } from "../services/authService";
import { useProfileImage } from "../context/ProfileImageContext";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData, profileImage?: File) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

    const mapServiceUserToAuthUser = (serviceUser: ServiceUser): AuthUser => {
  return {
    username: serviceUser.username,
    role: serviceUser.role as AuthUser['role'],
    img_url: serviceUser.img_url
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const profileImage = useProfileImage();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(mapServiceUserToAuthUser(currentUser));
          setIsAuthenticated(true);
          
          if (currentUser.img_url) {
            profileImage.updateProfileImage(currentUser.img_url);
          }
        }
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [profileImage]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const loggedInUser = await authService.login(credentials);
      setUser(mapServiceUserToAuthUser(loggedInUser));
      setIsAuthenticated(true);
      
      if (loggedInUser.img_url) {
        profileImage.updateProfileImage(loggedInUser.img_url);
      } else {
        profileImage.clearProfileImage();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData, profileImage?: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const registeredUser = await authService.register(data, profileImage);
      
      setUser(mapServiceUserToAuthUser(registeredUser));
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      profileImage.clearProfileImage();
      
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export { AuthContext };