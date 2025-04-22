import { Navigate } from "react-router-dom";
import React from "react";
import { useAuth } from "../hooks/useAuth";
import Loading from "./loading";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while authentication status is being determined
  if (isLoading) {
    return <Loading message="Verifying authentication..." />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
