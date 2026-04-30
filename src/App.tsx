/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentHistory from './pages/StudentHistory';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role: string }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[var(--color-luxury-dark)] flex items-center justify-center text-[var(--color-gold-500)]">جاري التحميل...</div>;
  if (!user || user.role !== role) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/history" element={<ProtectedRoute role="student"><StudentHistory /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute role="shop"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/shop/history" element={<ProtectedRoute role="shop"><StudentHistory /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
