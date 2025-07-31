import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Deck from '../../components/Deck';

const AvailableLoads = () => {
  const [loads, setLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/loads/available`, {
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

  const handleSwipe = async (direction, loadId) => {
    try {
      const token = localStorage.getItem('token');
      if (direction === 'right') {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/matches`, { loadId, status: 'PENDING', action: 'swipe' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (direction === 'left') {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/matches`, { loadId, status: 'REJECTED', action: 'swipe' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setLoads(loads.filter(load => load.id !== loadId));
    } catch (err) {
      console.error('Failed to swipe', err);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Available Loads</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <Deck data={loads} onSwipe={handleSwipe} />
    </div>
  );
};

export default AvailableLoads;
