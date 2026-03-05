import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/Wallet';
import SchedulePage from './pages/Schedule';
import StudyPage from './pages/Study';
// Devotional removed

import { EngineeringPage, AIPage, TheologyPage } from './pages/Portals';
import PlanPage from './pages/Plan';
import JosselinPage from './pages/Josselin';
import About from './pages/About';

import SettingsPage from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="study" element={<StudyPage />} />

            <Route path="engineering" element={<EngineeringPage />} />
            <Route path="ai" element={<AIPage />} />
            <Route path="theology" element={<TheologyPage />} />
            <Route path="programming" element={<PlanPage />} />
            <Route path="josselin" element={<JosselinPage />} />
            <Route path="about" element={<About />} />
            <Route path="settings" element={<SettingsPage />} />

          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default App;