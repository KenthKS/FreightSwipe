
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateLoadForm from '../components/CreateLoadForm';

const ShipperDashboard = () => {
  const [loads, setLoads] = useState([]);
  const [matchedLoads, setMatchedLoads] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [error, setError] = useState('');

  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/loads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoads(response.data);
    } catch (err) {
      setError('Failed to fetch loads');
    }
  };

  const fetchMatchedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatchedLoads(response.data.filter(match => match.status === 'MATCHED'));
      setPendingMatches(response.data.filter(match => match.status === 'PENDING' && match.shipperId === localStorage.getItem('userId'))); // Filter for pending matches relevant to this shipper
    } catch (err) {
      setError('Failed to fetch matched loads');
    }
  };

  useEffect(() => {
    fetchLoads();
    fetchMatchedLoads();
  }, []);

  const handleNewLoad = (newLoad) => {
    setLoads([newLoad, ...loads]);
  };

  const handleMatchResponse = async (matchId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/matches', { matchId, status, action: 'respond' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatchedLoads(); // Refresh matched and pending loads
    } catch (err) {
      console.error('Failed to respond to match:', err);
      setError('Failed to respond to match');
    }
  };

  const handleDeleteLoad = async (loadId) => {
    if (window.confirm('Are you sure you want to delete this load?')) {
      try {
        const token = localStorage.getItem('token');
        console.log('Attempting to delete load with ID:', loadId);
        console.log('Sending DELETE request to:', `http://localhost:3001/loads/${loadId}`);
        await axios.delete(`http://localhost:3001/loads/${loadId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLoads(loads.filter(load => load.id !== loadId));
        console.log('Load deleted successfully from frontend state.');
      } catch (err) {
        console.error('Failed to delete load:', err);
        setError('Failed to delete load');
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2>Shipper Dashboard</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <CreateLoadForm onNewLoad={handleNewLoad} />
      <div className="mt-4">
        <h3>Your Loads</h3>
        <ul className="list-group">
          {loads.map(load => (
            <li key={load.id} className="list-group-item">
              <h5>{load.origin} to {load.destination}</h5>
              <p>Weight: {load.weight} lbs</p>
              <p>Budget: ${load.budget}</p>
              <p>Deadline: {new Date(load.deadline).toLocaleDateString()}</p>
              <p>Status: {load.status}</p>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLoad(load.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h3>Pending Matches</h3>
        <ul className="list-group">
          {pendingMatches.length > 0 ? (
            pendingMatches.map(match => (
              <li key={match.id} className="list-group-item">
                <h5>Load: {match.load.origin} to {match.load.destination}</h5>
                <p>Trucker: {match.trucker.name} ({match.trucker.email})</p>
                <p>Status: {match.status}</p>
                <button className="btn btn-success btn-sm me-2" onClick={() => handleMatchResponse(match.id, 'MATCHED')}>Accept Match</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleMatchResponse(match.id, 'REJECTED')}>Reject Match</button>
              </li>
            ))
          ) : (
            <li className="list-group-item">No pending matches.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3>Matched Loads</h3>
        <ul className="list-group">
          {matchedLoads.length > 0 ? (
            matchedLoads.map(match => (
              <li key={match.id} className="list-group-item">
                <h5>Load: {match.load.origin} to {match.load.destination}</h5>
                <p>Trucker: {match.trucker.name} ({match.trucker.email})</p>
                <p>Status: {match.status}</p>
              </li>
            ))
          ) : (
            <li className="list-group-item">No matched loads yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ShipperDashboard;
