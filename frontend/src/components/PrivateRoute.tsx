import { Navigate } from 'react-router-dom';
import React from 'react';


interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}