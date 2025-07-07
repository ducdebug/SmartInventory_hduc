import { Navigate } from "react-router-dom";
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../loading";

const SupplierTemporaryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading message="Verifying authentication..." />;
  }
  
  if (isAuthenticated && (user?.role === 'SUPPLIER' || user?.role === 'TEMPORARY')) {
    return <>{children}</>;
  }

  // Redirect based on user role
  if (isAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/" replace />;
    }
    // For any other authenticated user, redirect to history
    return <Navigate to="/history" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default SupplierTemporaryRoute;
