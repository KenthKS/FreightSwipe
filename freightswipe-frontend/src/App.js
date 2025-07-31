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

// Trucker Pages
import AvailableLoadsTrucker from './pages/trucker/AvailableLoads';
import MatchedLoadsTrucker from './pages/trucker/MatchedLoads';
import InTransitLoadsTrucker from './pages/trucker/InTransitLoads';
import AcceptedLoadsTrucker from './pages/trucker/AcceptedLoads';
import DeclinedLoadsTrucker from './pages/trucker/DeclinedLoads';
import CompletedLoadsTrucker from './pages/trucker/CompletedLoads';

// Shipper Pages
import YourLoadsShipper from './pages/shipper/YourLoads';
import PendingMatchesShipper from './pages/shipper/PendingMatches';
import MatchedLoadsShipper from './pages/shipper/MatchedLoads';
import InTransitLoadsShipper from './pages/shipper/InTransitLoads';
import CompletedLoadsShipper from './pages/shipper/CompletedLoads';

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

        {/* Trucker Routes */}
        <Route path="/trucker/available-loads" element={<AvailableLoadsTrucker />} />
        <Route path="/trucker/matched-loads" element={<MatchedLoadsTrucker />} />
        <Route path="/trucker/in-transit-loads" element={<InTransitLoadsTrucker />} />
        <Route path="/trucker/accepted-loads" element={<AcceptedLoadsTrucker />} />
        <Route path="/trucker/declined-loads" element={<DeclinedLoadsTrucker />} />
        <Route path="/trucker/completed-loads" element={<CompletedLoadsTrucker />} />

        {/* Shipper Routes */}
        <Route path="/shipper/your-loads" element={<YourLoadsShipper />} />
        <Route path="/shipper/pending-matches" element={<PendingMatchesShipper />} />
        <Route path="/shipper/matched-loads" element={<MatchedLoadsShipper />} />
        <Route path="/shipper/in-transit-loads" element={<InTransitLoadsShipper />} />
        <Route path="/shipper/completed-loads" element={<CompletedLoadsShipper />} />
      </Routes>
    </Router>
  );
}

export default App;
