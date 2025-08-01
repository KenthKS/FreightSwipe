import React from 'react';
import { Link } from 'react-router-dom';

const TruckerDashboard = () => {
  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Trucker Dashboard</h2>
      <p className="text-center text-muted mb-4">Manage your loads and view your progress.</p>
      <div className="list-group">
        <Link to="/trucker/available-loads" className="list-group-item list-group-item-action">Available Loads</Link>
        <Link to="/trucker/matched-loads" className="list-group-item list-group-item-action">Matched Loads</Link>
        <Link to="/trucker/in-transit-loads" className="list-group-item list-group-item-action">Loads In Transit</Link>
        <Link to="/trucker/accepted-loads" className="list-group-item list-group-item-action">Accepted Loads</Link>
        <Link to="/trucker/declined-loads" className="list-group-item list-group-item-action">Declined Loads</Link>
        <Link to="/trucker/completed-loads" className="list-group-item list-group-item-action">Completed Loads</Link>
      </div>
    </div>
  );
};

export default TruckerDashboard;