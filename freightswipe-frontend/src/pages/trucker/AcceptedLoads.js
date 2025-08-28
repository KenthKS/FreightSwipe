import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AcceptedLoads = () => {
  const [acceptedLoads, setAcceptedLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchAcceptedLoads = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, { withCredentials: true });
      const { matches, userId } = response.data;
      console.log('All matches:', matches);
      const filteredMatches = matches.filter(match => match.status === 'PENDING' && match.truckerId === userId);
      console.log('Filtered accepted matches:', filteredMatches);
      setAcceptedLoads(filteredMatches);
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
              <h5>Load: {match.load.origin.address}, {match.load.origin.city}, {match.load.origin.province} to {match.load.destination.address}, {match.load.destination.city}, {match.load.destination.province}</h5>
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
