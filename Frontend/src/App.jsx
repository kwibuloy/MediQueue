import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PatientPage from './pages/PatientPage';
import AdminPage from './pages/AdminPage';
import PatientAuthPage from './pages/PatientAuthPage';
import AdminAuthPage from './pages/AdminAuthPage';
import LoginPage from './pages/LoginPage';
import NotAuthorizedPage from './pages/NotAuthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1 }}>
        <Navbar />
        <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
          <Route path="/patient/auth" element={<PatientAuthPage />} />
          <Route
            path="/patient"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/auth" element={<AdminAuthPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
