import { Navigate, useLocation } from "react-router-dom";
import React from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token && location.pathname !== "/set-password/:id/:token") {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (token) {
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode the payload
      const userRole = decodedToken.role;

      if (location.pathname === "/admin/logs" && userRole !== "owner") {
        return <Navigate to="/" replace />;
      }
    } catch (error) {
      console.error("Token decoding failed", error);
      return <Navigate to="/signin" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
}
