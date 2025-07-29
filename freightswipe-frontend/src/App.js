import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ShipperDashboard from './pages/ShipperDashboard';
import TruckerDashboard from './pages/TruckerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReviewsPage from './pages/ReviewsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
        <Route path="/trucker/dashboard" element={<TruckerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/reviews/:userId" element={<ReviewsPage />} />
      </Routes>
    </Router>
  );
}

export default App;