import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PatientPage from './pages/PatientPage';
import AdminPage from './pages/AdminPage';
import PatientAuthPage from './pages/PatientAuthPage';
import AdminAuthPage from './pages/AdminAuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1 }}>
        <Navbar />
        <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/patient/auth" element={<PatientAuthPage />} />
          <Route path="/patient" element={<PatientPage />} />
          <Route path="/admin/auth" element={<AdminAuthPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
