import { Navigate } from "react-router-dom";
import React from "react";
import { useAuth } from "../hooks/useAuth";
import Loading from "./loading";

const SupplierRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading message="Verifying authentication..." />;
  }
  
  if (isAuthenticated && user?.role === 'SUPPLIER') {
    return <>{children}</>;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
};

export default SupplierRoute;