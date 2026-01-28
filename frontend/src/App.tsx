import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/Wallet';
import SchedulePage from './pages/Schedule';
import StudyPage from './pages/Study';
// Devotional removed

import { EngineeringPage, AIPage } from './pages/Portals';
import PlanPage from './pages/Plan';

import SettingsPage from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="study" element={<StudyPage />} />

          <Route path="engineering" element={<EngineeringPage />} />
          <Route path="ai" element={<AIPage />} />
          <Route path="programming" element={<PlanPage />} />
          <Route path="settings" element={<SettingsPage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;