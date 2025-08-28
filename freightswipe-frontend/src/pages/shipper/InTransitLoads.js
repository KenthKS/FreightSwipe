import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InTransitLoads = () => {
  const [inTransitLoads, setInTransitLoads] = useState([]);
  const [error, setError] = useState('');

  const fetchInTransitLoads = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/loads`, { withCredentials: true });
      setInTransitLoads(response.data.filter(load => load.status === 'IN_TRANSIT'));
    } catch (err) {
      setError('Failed to fetch in-transit loads');
    }
  };

  useEffect(() => {
    fetchInTransitLoads();
  }, []);

  const handleUpdateLoadStatus = async (loadId, status) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/status`, { status }, { withCredentials: true });
      fetchInTransitLoads();
    } catch (err) {
      console.error('Failed to update load status:', err);
      setError('Failed to update load status');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Loads In Transit</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <ul className="list-group">
        {inTransitLoads.length > 0 ? (
          inTransitLoads.map(load => {
            const matchedTrucker = load.matches && load.matches.length > 0 ? load.matches.find(match => match.status === 'MATCHED')?.trucker : null;
            return (
              <li key={load.id} className="list-group-item">
                <h5>Load: {load.origin.address}, {load.origin.city}, {load.origin.province} to {load.destination.address}, {load.destination.city}, {load.destination.province}</h5>
                {matchedTrucker && <p>Trucker: {matchedTrucker.name} ({matchedTrucker.email})</p>}
                <p>Status: {load.status}</p>
                {load.status === 'IN_TRANSIT' && (
                  <button className="btn btn-success btn-sm mt-2" onClick={() => handleUpdateLoadStatus(load.id, 'COMPLETED')}>Mark as Completed</button>
                )}
              </li>
            )
          })
        ) : (
          <li className="list-group-item">No loads in transit.</li>
        )}
      </ul>
    </div>
  );
};

export default InTransitLoads;
