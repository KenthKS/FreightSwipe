import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MatchedLoads = () => {
  const [matchedLoads, setMatchedLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchMatchedLoads = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, { withCredentials: true });
      setMatchedLoads(response.data.filter(match => match.status === 'MATCHED' && match.load.status === 'MATCHED'));
    } catch (err) {
      setError('Failed to fetch matched loads');
    }
  };

  useEffect(() => {
    fetchMatchedLoads();
  }, []);

  const handleUpdateLoadStatus = async (loadId, status) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/status`, { status }, { withCredentials: true });
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
      <ul className="list-group">
        {matchedLoads.length > 0 ? (
          matchedLoads.map(match => (
            <li key={match.id} className="list-group-item">
              <h5>Load: {match.load.origin.address}, {match.load.origin.city}, {match.load.origin.province} to {match.load.destination.address}, {match.load.destination.city}, {match.load.destination.province}</h5>
              <p>Trucker: {match.trucker.name} ({match.trucker.email})</p>
              <Link to={`/reviews/${match.trucker.id}`} className="btn btn-info btn-sm me-2">View Reviews</Link>
              <p>Status: {match.status}</p>
              {match.load.status === 'MATCHED' && !match.load.shipperInTransitConfirmed && (
                <button className="btn btn-info btn-sm mt-2" onClick={() => handleUpdateLoadStatus(match.load.id, 'IN_TRANSIT')}>Mark as In Transit</button>
              )}
              {match.load.status === 'MATCHED' && match.load.shipperInTransitConfirmed && !match.load.truckerInTransitConfirmed && (
                <p className="text-info mt-2">Waiting for Trucker to confirm In Transit</p>
              )}
              {match.load.status === 'MATCHED' && match.load.shipperInTransitConfirmed && match.load.truckerInTransitConfirmed && (
                <p className="text-success mt-2">Both confirmed. Load is In Transit.</p>
              )}
            </li>
          ))
        ) : (
          <li className="list-group-item">No matched loads yet.</li>
        )}
      </ul>
    </div>
  );
};

export default MatchedLoads;
