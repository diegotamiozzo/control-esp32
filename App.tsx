import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MachineProvider, useMachine } from './context/MachineContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import TestMode from './pages/TestMode';

const AppRoutes = () => {
  const { state } = useMachine();

  if (!state.macAddress) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/test-mode" element={<TestMode />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <MachineProvider>
      <Router>
        <AppRoutes />
      </Router>
    </MachineProvider>
  );
};

export default App;