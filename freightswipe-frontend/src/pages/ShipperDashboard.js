import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CreateLoadForm from '../components/CreateLoadForm';

/**
 * The main dashboard for shippers.
 * Displays the Create Load form and navigation links to other shipper-related pages.
 */
const ShipperDashboard = () => {
  const navigate = useNavigate();

  /**
   * Handles the creation of a new load.
   * Navigates the user to the "Your Loads" page to see the newly created load.
   * @param {object} newLoad - The newly created load object.
   */
  const handleNewLoad = (newLoad) => {
    navigate('/shipper/your-loads');
  };

  return (
    <div className="container mt-5">
      <h2>Shipper Dashboard</h2>

      {/* --- Create New Load Form --- */}
      <CreateLoadForm onNewLoad={handleNewLoad} />

      {/* --- Navigation Links --- */}
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
