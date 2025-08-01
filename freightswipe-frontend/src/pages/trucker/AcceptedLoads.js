import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AcceptedLoads = () => {
  const [acceptedLoads, setAcceptedLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchAcceptedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMatches = response.data;
      const userId = localStorage.getItem('userId');
      setAcceptedLoads(allMatches.filter(match => match.status === 'PENDING' && match.truckerId === userId));
    } catch (err) {
      setError('Failed to fetch accepted loads');
    }
  };

  useEffect(() => {
    fetchAcceptedLoads();
  }, []);

  return (
    <div className="container mt-5">
      <h2>Accepted Loads (Pending Shipper Confirmation)</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {acceptedLoads.length > 0 ? (
        <ul className="list-group">
          {acceptedLoads.map(match => (
            <li key={match.id} className="list-group-item">
              <h5>Load: {match.load.origin} to {match.load.destination}</h5>
              <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
              <p>Status: {match.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>No accepted loads yet.</p>
          <Link to="/trucker/available-loads" className="btn btn-primary">Find Loads</Link>
        </div>
      )}
    </div>
  );
};

export default AcceptedLoads;
