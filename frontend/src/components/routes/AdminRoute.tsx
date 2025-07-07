import { Navigate } from "react-router-dom";
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../loading";

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading message="Verifying authentication..." />;
  }
  
  if (isAuthenticated && user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  // Redirect based on user role
  if (isAuthenticated) {
    if (user?.role === 'SUPPLIER' || user?.role === 'TEMPORARY') {
      return <Navigate to="/buyer-dashboard" replace />;
    }
    // For any other authenticated user, redirect to history
    return <Navigate to="/history" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default AdminRoute;
