import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MatchedLoads = () => {
  const [matchedLoads, setMatchedLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchMatchedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMatches = response.data;
      setMatchedLoads(allMatches.filter(match => match.status === 'MATCHED' && match.load.status === 'MATCHED'));
    } catch (err) {
      setError('Failed to fetch matched loads');
    }
  };

  useEffect(() => {
    fetchMatchedLoads();
  }, []);

  const handleUpdateLoadStatus = async (loadId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatchedLoads();
    } catch (err) {
      console.error('Failed to update load status:', err);
      setError('Failed to update load status');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Matched Loads</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {matchedLoads.length > 0 ? (
        <ul className="list-group">
          {matchedLoads.map(match => (
            <li key={match.id} className="list-group-item">
              <h5>Load: {match.load.origin} to {match.load.destination}</h5>
              <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
              <Link to={`/reviews/${match.shipper.id}`} className="btn btn-info btn-sm me-2">View Reviews</Link>
              <p>Status: {match.status}</p>
              {match.load.status === 'MATCHED' && !match.load.truckerInTransitConfirmed && (
                <button className="btn btn-info btn-sm mt-2" onClick={() => handleUpdateLoadStatus(match.load.id, 'IN_TRANSIT')}>Mark as In Transit</button>
              )}
              {match.load.status === 'MATCHED' && match.load.truckerInTransitConfirmed && !match.load.shipperInTransitConfirmed && (
                <p className="text-info mt-2">Waiting for Shipper to confirm In Transit</p>
              )}
              {match.load.status === 'MATCHED' && match.load.truckerInTransitConfirmed && match.load.shipperInTransitConfirmed && (
                <p className="text-success mt-2">Both confirmed. Load is In Transit.</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>No matched loads yet.</p>
          <Link to="/trucker/available-loads" className="btn btn-primary">Find Loads</Link>
        </div>
      )}
    </div>
  );
};

export default MatchedLoads;
