import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginForm from "./LoginForm.jsx";
import DashboardLayout from "./DashboardLayout.jsx";
import ProtectedRoute from "./ProtectedRoutes.jsx";
import DashboardSummary from "./DashboardSummary.jsx";
import TagsPage from "./TagsPage.jsx";
import BlogsListPage from "./BlogsListPage.jsx";
import BlogCategoriesListPage from "./BlogCategoryListPage.jsx";
import AuthorsListPage from "./AuthorsListPage.jsx";
import MerchantListPage from "./MerchantsListPage.jsx";
import MerchantCategoriesListPage from "./MerchantCategoriesListPage.jsx";

export default function AppRouter() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(Boolean(token));
  }, []);

  if (!isClient) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginForm />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default inside dashboard */}
          <Route index element={<Navigate to="summary" replace />} />
          <Route path="summary" element={<DashboardSummary />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="blogs" element={<BlogsListPage />} />
          <Route path="blog-categories" element={<BlogCategoriesListPage />} />
          <Route path="authors" element={<AuthorsListPage />} />
          <Route path="merchants" element={<MerchantListPage/>} />
          <Route path="merchant-categories" element={<MerchantCategoriesListPage />} />
           {/* More child screens here */}
        </Route>

        {/* Root redirect */}
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

        {/* 404 fallback */}
        <Route path="*" element={<p>404 Not Found</p>} />
      </Routes>
    </BrowserRouter>
  );
}