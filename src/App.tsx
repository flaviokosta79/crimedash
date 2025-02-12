import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './pages/Dashboard';
import { UnitDashboard } from './pages/UnitDashboard';
import { Targets } from './pages/Targets';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/unit/:unit" element={<UnitDashboard />} />
        <Route path="/targets" element={<Targets />} />
      </Routes>
    </Router>
  );
}

export default App;
