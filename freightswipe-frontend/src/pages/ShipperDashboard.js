import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CreateLoadForm from '../components/CreateLoadForm';

const ShipperDashboard = () => {
  const navigate = useNavigate();

  const handleNewLoad = (newLoad) => {
    // Navigate to the Your Loads page to see the newly created load
    navigate('/shipper/your-loads');
  };

  return (
    <div className="container mt-5">
      <h2>Shipper Dashboard</h2>
      <CreateLoadForm onNewLoad={handleNewLoad} />
      <div className="list-group mt-4">
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
