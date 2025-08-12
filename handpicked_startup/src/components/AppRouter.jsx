import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginForm from "./LoginForm.jsx";
import DashboardLayout from "./DashboardLayout.jsx";
import ProtectedRoute from "./ProtectedRoutes.jsx";

export default function AppRouter() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Ensure client-side rendering before accessing localStorage
    setIsClient(true);
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(Boolean(token));
  }, []);

  if (!isClient) {
    return null; // Prevents SSR hydration errors
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginForm />} />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />

        {/* Root redirect based on auth */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<p>404 Not Found</p>} />
      </Routes>
    </BrowserRouter>
  );
}