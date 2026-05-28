// frontend/src/pages/admin/ProtectedAdminRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in → send to /login and remember where they came from
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not Rim (not OWNER) → send to home
  if (user.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  return children;
}
