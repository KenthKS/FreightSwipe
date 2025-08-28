import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Deck from '../../components/Deck';
import { Link } from 'react-router-dom';

const PendingMatches = () => {
  const [pendingMatches, setPendingMatches] = useState([]);
  const [error, setError] = useState('');

  const fetchPendingMatches = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, { withCredentials: true });
      const { matches, userId } = response.data;
      setPendingMatches(matches.filter(match => match.status === 'PENDING' && match.shipperId === userId));
    } catch (err) {
      setError('Failed to fetch pending matches');
    }
  };

  useEffect(() => {
    fetchPendingMatches();
  }, []);

  const handleMatchResponse = async (direction, matchId) => {
    try {
      const status = direction === 'right' ? 'MATCHED' : 'REJECTED';
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/matches`, { matchId, status, action: 'respond' }, { withCredentials: true });
      fetchPendingMatches();
    } catch (err) {
      console.error('Failed to respond to match:', err);
      setError('Failed to respond to match');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Pending Matches</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <Deck data={pendingMatches} onSwipe={handleMatchResponse} />
    </div>
  );
};

export default PendingMatches;