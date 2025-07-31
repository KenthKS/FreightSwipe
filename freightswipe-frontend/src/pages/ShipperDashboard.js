import React from 'react';
import { Link } from 'react-router-dom';

const ShipperDashboard = () => {
  return (
    <div className="container mt-5">
      <h2>Shipper Dashboard</h2>
      <div className="list-group">
        <Link to="/shipper/your-loads" className="list-group-item list-group-item-action">Your Loads</Link>
        <Link to="/shipper/pending-matches" className="list-group-item list-group-item-action">Pending Matches</Link>
        <Link to="/shipper/matched-loads" className="list-group-item list-group-item-action">Matched Loads</Link>
        <Link to="/shipper/in-transit-loads" className="list-group-item list-group-item-action">Loads In Transit</Link>
        <Link to="/shipper/completed-loads" className="list-group-item list-group-item-action">Completed Loads</Link>
      </div>
    </div>
  );
};

export default ShipperDashboard;
