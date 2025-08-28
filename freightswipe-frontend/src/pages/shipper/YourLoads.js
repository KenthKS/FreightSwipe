import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * A component that displays a list of loads created by the shipper.
 */
const YourLoads = () => {
  // State variables for loads and error messages
  const [loads, setLoads] = useState([]);
  const [error, setError] = useState('');

  /**
   * Fetches the shipper's loads from the backend.
   */
  const fetchLoads = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/loads`, { withCredentials: true });
      console.log('Frontend received loads data:', response.data);
      // Sort loads by creation date in descending order
      const sortedLoads = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLoads(sortedLoads);
    } catch (err) {
      setError('Failed to fetch loads');
    }
  };

  // Fetch loads when the component mounts
  useEffect(() => {
    fetchLoads();
  }, []);

  /**
   * Handles the deletion of a load.
   * @param {string} loadId - The ID of the load to delete.
   */
  const handleDeleteLoad = async (loadId) => {
    // Confirm the deletion with the user
    if (window.confirm('Are you sure you want to delete this load?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}`, { withCredentials: true });
        // Remove the deleted load from the state
        setLoads(loads.filter(load => load.id !== loadId));
      } catch (err) {
        console.error('Failed to delete load:', err);
        setError('Failed to delete load');
      }
    }
  };

  /**
   * Handles the cancellation of a load.
   * @param {string} loadId - The ID of the load to cancel.
   */
  const handleCancelLoad = async (loadId) => {
    // Confirm the cancellation with the user
    if (window.confirm('Are you sure you want to cancel this load? A $5 fee will be charged to your account.')) {
      try {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/cancel`, {}, { withCredentials: true });
        // Refetch the loads to update the status
        fetchLoads();
      } catch (err) {
        console.error('Failed to cancel load:', err);
        setError(err.response?.data?.error || 'Failed to cancel load');
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
            <h5>{load.origin?.address}, {load.origin?.city}, {load.origin?.province} to {load.destination?.address}, {load.destination?.city}, {load.destination?.province}</h5>
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