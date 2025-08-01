import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DeclinedLoads = () => {
  const [declinedLoads, setDeclinedLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchDeclinedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMatches = response.data;
      setDeclinedLoads(allMatches.filter(match => match.status === 'REJECTED'));
    } catch (err) {
      setError('Failed to fetch declined loads');
    }
  };

  useEffect(() => {
    fetchDeclinedLoads();
  }, []);

  return (
    <div className="container mt-5">
      <h2>Declined Loads</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {declinedLoads.length > 0 ? (
        <ul className="list-group">
          {declinedLoads.map(match => (
            <li key={match.id} className="list-group-item">
              <h5>Load: {match.load.origin} to {match.load.destination}</h5>
              <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
              <p>Status: {match.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>No declined loads yet.</p>
          <Link to="/trucker/available-loads" className="btn btn-primary">Find Loads</Link>
        </div>
      )}
    </div>
  );
};

export default DeclinedLoads;
