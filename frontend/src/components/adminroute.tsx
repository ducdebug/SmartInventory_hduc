import { Navigate } from "react-router-dom";
import React from "react";
import { useAuth } from "../hooks/useAuth";
import Loading from "./loading";

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while authentication status is being determined
  if (isLoading) {
    return <Loading message="Verifying authentication..." />;
  }
  
  // Check if authenticated and has ADMIN role
  if (isAuthenticated && user?.role === 'ADMIN') {
    return <>{children}</>;
  }
  
  // If authenticated but not admin, redirect to home
  // If not authenticated, redirect to login
  return isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
};

export default AdminRoute;