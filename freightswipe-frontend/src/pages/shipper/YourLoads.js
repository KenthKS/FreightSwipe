import React, { useState, useEffect } from 'react';
import axios from 'axios';

const YourLoads = () => {
  const [loads, setLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/loads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedLoads = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLoads(sortedLoads);
    } catch (err) {
      setError('Failed to fetch loads');
    }
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  const handleDeleteLoad = async (loadId) => {
    if (window.confirm('Are you sure you want to delete this load?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLoads(loads.filter(load => load.id !== loadId));
      } catch (err) {
        console.error('Failed to delete load:', err);
        setError('Failed to delete load');
      }
    }
  };

  const handleCancelLoad = async (loadId) => {
    if (window.confirm('Are you sure you want to cancel this load? A $5 fee will be charged to your account.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchLoads();
      } catch (err) {
        console.error('Failed to cancel load:', err);
        setError('Failed to cancel load');
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2>Your Loads</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <ul className="list-group mt-4">
        {loads.map(load => (
          <li key={load.id} className="list-group-item">
            <h5>{load.origin} to {load.destination}</h5>
            <p>Weight: {load.weight} lbs</p>
            <p>Budget: ${load.budget}</p>
            <p>Deadline: {new Date(load.deadline).toLocaleDateString()}</p>
            <p>Status: {load.status}</p>
            {load.status === 'PENDING' && (
              <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteLoad(load.id)}>Delete</button>
            )}
            {load.status === 'MATCHED' && (
              <button className="btn btn-warning btn-sm" onClick={() => handleCancelLoad(load.id)}>Cancel Load ($5 fee)</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default YourLoads;