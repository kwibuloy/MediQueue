import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PatientPage from './pages/PatientPage';
import AdminPage from './pages/AdminPage';
import PatientAuthPage from './pages/PatientAuthPage';
import AdminAuthPage from './pages/AdminAuthPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import LoginPage from './pages/LoginPage';
import NotAuthorizedPage from './pages/NotAuthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { clearAccessToken, getAccessToken, getUserRole } from './services/api';
import { supabase } from './services/supabaseClient';

export default function App() {
  useEffect(() => {
    const DEPLOYMENT_VERSION_KEY = 'app_deployment_version';
    const CURRENT_VERSION = new Date().toISOString().split('T')[0];
    const storedVersion = localStorage.getItem(DEPLOYMENT_VERSION_KEY);

    if (storedVersion !== CURRENT_VERSION) {
      localStorage.clear();
      localStorage.setItem(DEPLOYMENT_VERSION_KEY, CURRENT_VERSION);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const syncAuthState = async () => {
      const token = getAccessToken();
      const savedRole = getUserRole();
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;
      const sessionRole = session?.user?.user_metadata?.role;

      if (!active) return;

      if (error || !session) {
        if (token || savedRole) {
          clearAccessToken();
        }
        return;
      }

      if (sessionRole && sessionRole !== savedRole) {
        localStorage.setItem('user_role', sessionRole);
      }
    };

    syncAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      syncAuthState();
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

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
          <Route path="/admin/register" element={<AdminRegisterPage />} />
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
