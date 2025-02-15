import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Targets } from './pages/Targets';
import { UserManagement } from './pages/UserManagement';
import { UnitDashboard } from './pages/UnitDashboard';
import { PrivateRoute } from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Rota raiz redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas protegidas */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/targets" element={
          <PrivateRoute>
            <Targets />
          </PrivateRoute>
        } />

        <Route path="/users" element={
          <PrivateRoute>
            <UserManagement />
          </PrivateRoute>
        } />

        <Route path="/unit/:unit" element={
          <PrivateRoute>
            <UnitDashboard />
          </PrivateRoute>
        } />

        {/* Qualquer outra rota redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
