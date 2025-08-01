import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const InTransitLoads = () => {
  const [inTransitLoads, setInTransitLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchInTransitLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMatches = response.data;
      const userId = localStorage.getItem('userId');
      setInTransitLoads(allMatches.filter(match => match.status === 'MATCHED' && match.load.status === 'IN_TRANSIT' && match.truckerId === userId));
    } catch (err) {
      setError('Failed to fetch in-transit loads');
    }
  };

  useEffect(() => {
    fetchInTransitLoads();
  }, []);

  return (
    <div className="container mt-5">
      <h2>Loads In Transit</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {inTransitLoads.length > 0 ? (
        <ul className="list-group">
          {inTransitLoads.map(match => (
            <li key={match.id} className="list-group-item">
              <h5>Load: {match.load.origin} to {match.load.destination}</h5>
              <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
              <p>Status: {match.load.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>No loads in transit.</p>
          <Link to="/trucker/matched-loads" className="btn btn-primary">View Matched Loads</Link>
        </div>
      )}
    </div>
  );
};

export default InTransitLoads;
