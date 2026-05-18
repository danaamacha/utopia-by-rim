// frontend/src/pages/admin/ProtectedAdminRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { user } = useAuth() || {};
  const loc = useLocation();

  // Not logged in -> Login first
  if (!user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  // Logged in but NOT Rim (owner) -> send to home
  if (user.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  // Rim (role === "owner") -> allowed
  return children;
}
