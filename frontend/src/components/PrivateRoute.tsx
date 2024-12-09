import { Navigate, useLocation } from "react-router-dom";
import React from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // Allow the route to be accessed without token if it's for /set-password
  if (!token && location.pathname !== "/set-password/:id/:token") {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
