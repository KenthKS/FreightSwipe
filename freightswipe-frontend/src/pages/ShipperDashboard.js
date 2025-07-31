import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CreateLoadForm from '../components/CreateLoadForm';

// ShipperDashboard component for managing loads, matches, and reviews
const ShipperDashboard = () => {
  // State variables for different categories of loads and UI controls
  const [loads, setLoads] = useState([]); // All loads created by the shipper
  const [matchedLoads, setMatchedLoads] = useState([]); // Loads that have been matched with a trucker
  const [pendingMatches, setPendingMatches] = useState([]); // Matches initiated by truckers, awaiting shipper's response
  const [inTransitLoads, setInTransitLoads] = useState([]); // Loads currently in transit
  const [completedLoads, setCompletedLoads] = useState([]); // Loads that have been completed
  const [error, setError] = useState(''); // State for displaying error messages
  const [showReviewForm, setShowReviewForm] = useState(false); // Controls visibility of the review form
  const [reviewLoadId, setReviewLoadId] = useState(null); // ID of the load being reviewed
  const [reviewRating, setReviewRating] = useState(5); // Rating for the review
  const [reviewComment, setReviewComment] = useState(''); // Comment for the review

  // Fetches all loads created by the current shipper
  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/loads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoads(response.data);
      // Filter for loads that are marked as 'COMPLETED'
      setCompletedLoads(response.data.filter(load => load.status === 'COMPLETED'));
    } catch (err) {
      setError('Failed to fetch loads');
    }
  };

  // Fetches all matches related to the current shipper
  const fetchMatchedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for matches where the status is 'MATCHED' and the associated load is also 'MATCHED'
      setMatchedLoads(response.data.filter(match => match.status === 'MATCHED' && match.load.status === 'MATCHED'));
      // Filter for pending matches where the current user is the shipper
      setPendingMatches(response.data.filter(match => match.status === 'PENDING' && match.shipperId === localStorage.getItem('userId')));
      // Filter for loads that are currently 'IN_TRANSIT'
      setInTransitLoads(response.data.filter(match => match.load.status === 'IN_TRANSIT'));
    } catch (err) {
      setError('Failed to fetch matched loads');
    }
  };

  // Effect hook to fetch initial data when the component mounts
  useEffect(() => {
    fetchLoads();
    fetchMatchedLoads();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handles adding a newly created load to the state
  const handleNewLoad = (newLoad) => {
    setLoads([newLoad, ...loads]);
  };

  // Handles shipper's response (accept/reject) to a pending match
  const handleMatchResponse = async (matchId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/matches`, { matchId, status, action: 'respond' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatchedLoads(); // Re-fetch matched and pending loads to update UI
    } catch (err) {
      console.error('Failed to respond to match:', err);
      setError('Failed to respond to match');
    }
  };

  // Handles updating the status of a load (e.g., from MATCHED to IN_TRANSIT, or IN_TRANSIT to COMPLETED)
  const handleUpdateLoadStatus = async (loadId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLoads(); // Re-fetch available loads to update status
      fetchMatchedLoads(); // Re-fetch matched loads to update all lists
    } catch (err) {
      console.error('Failed to update load status:', err);
      setError('Failed to update load status');
    }
  };

  // Handles deleting a load
  const handleDeleteLoad = async (loadId) => {
    if (window.confirm('Are you sure you want to delete this load?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLoads(loads.filter(load => load.id !== loadId)); // Remove deleted load from state
      } catch (err) {
        console.error('Failed to delete load:', err);
        setError('Failed to delete load');
      }
    }
  };

  // Handles cancelling a load, incurring a fee
  const handleCancelLoad = async (loadId) => {
    if (window.confirm('Are you sure you want to cancel this load? A $5 fee will be charged to your account.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchLoads(); // Re-fetch loads to update status
        fetchMatchedLoads(); // Re-fetch matched loads to update all lists
      } catch (err) {
        console.error('Failed to cancel load:', err);
        setError('Failed to cancel load');
      }
    }
  };

  // Prepares the review form for a specific load
  const handleReview = (loadId) => {
    setReviewLoadId(loadId);
    setShowReviewForm(true);
  };

  // Submits a new review for a completed load
  const handleSubmitReview = async () => {
    // Client-side validation for rating range
    if (reviewRating < 1 || reviewRating > 5) {
      setError('Rating must be between 0 and 5.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/reviews`, { loadId: reviewLoadId, rating: parseInt(reviewRating), comment: reviewComment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Reset review form state
      setShowReviewForm(false);
      setReviewLoadId(null);
      setReviewRating(5);
      setReviewComment('');
      setError(''); // Clear any previous errors
      fetchMatchedLoads(); // Re-fetch loads to update review status
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review');
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
              {load.status !== 'COMPLETED' && load.status !== 'CANCELLED' && (
                <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteLoad(load.id)}>Delete</button>
              )}
              {load.status !== 'COMPLETED' && load.status !== 'CANCELLED' && (
                <button className="btn btn-warning btn-sm" onClick={() => handleCancelLoad(load.id)}>Cancel Load ($5 fee)</button>
              )}
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
                <Link to={`/reviews/${match.trucker.id}`} className="btn btn-info btn-sm me-2">View Reviews</Link>
                <p>Status: {match.status}</p>
                {match.load.status === 'MATCHED' && !match.load.shipperInTransitConfirmed && (
                  <button className="btn btn-info btn-sm mt-2" onClick={() => handleUpdateLoadStatus(match.load.id, 'IN_TRANSIT')}>Mark as In Transit</button>
                )}
                {match.load.status === 'MATCHED' && match.load.shipperInTransitConfirmed && !match.load.truckerInTransitConfirmed && (
                  <p className="text-info mt-2">Waiting for Trucker to confirm In Transit</p>
                )}
                {match.load.status === 'MATCHED' && match.load.shipperInTransitConfirmed && match.load.truckerInTransitConfirmed && (
                  <p className="text-success mt-2">Both confirmed. Load is In Transit.</p>
                )}
              </li>
            ))
          ) : (
            <li className="list-group-item">No matched loads yet.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3>Loads In Transit</h3>
        <ul className="list-group">
          {inTransitLoads.length > 0 ? (
            inTransitLoads.map(match => (
              <li key={match.id} className="list-group-item">
                <h5>Load: {match.load.origin} to {match.load.destination}</h5>
                <p>Trucker: {match.trucker.name} ({match.trucker.email})</p>
                <p>Status: {match.load.status}</p>
                {match.load.status === 'IN_TRANSIT' && (
                  <button className="btn btn-success btn-sm mt-2" onClick={() => handleUpdateLoadStatus(match.load.id, 'COMPLETED')}>Mark as Completed</button>
                )}
              </li>
            ))
          ) : (
            <li className="list-group-item">No loads in transit.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3>Completed Loads</h3>
        <ul className="list-group">
          {completedLoads.length > 0 ? (
            completedLoads.map(load => {
              const userId = localStorage.getItem('userId');
              const hasReviewed = load.reviews && Array.isArray(load.reviews) && load.reviews.some(review => review.reviewerId === userId);
              const matchedTrucker = load.matches && load.matches.length > 0 ? load.matches[0].trucker : null;
              return (
                <li key={load.id} className="list-group-item">
                  <h5>{load.origin} to {load.destination}</h5>
                  <p>Weight: {load.weight} lbs</p>
                  <p>Budget: ${load.budget}</p>
                  <p>Deadline: {new Date(load.deadline).toLocaleDateString()}</p>
                  <p>Status: {load.status}</p>
                  {load.status === 'COMPLETED' && !hasReviewed && (
                    <button className="btn btn-primary btn-sm mt-2" onClick={() => handleReview(load.id)}>Leave Review</button>
                  )}
                  {load.status === 'COMPLETED' && matchedTrucker && (
                    <Link to={`/reviews/${matchedTrucker.id}`} className="btn btn-info btn-sm mt-2 ms-2">View Reviews</Link>
                  )}
                </li>
              )
            })
          ) : (
            <li className="list-group-item">No completed loads yet.</li>
          )}
        </ul>
      </div>

      {showReviewForm && (
        <div className="mt-4">
          <h3>Leave a Review for Load: {reviewLoadId}</h3>
          <div className="mb-3">
            <label className="form-label">Rating (1-5)</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max="5"
              value={reviewRating}
              onChange={(e) => setReviewRating(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Comment (Optional)</label>
            <textarea
              className="form-control"
              rows="3"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            ></textarea>
          </div>
          <button className="btn btn-success me-2" onClick={handleSubmitReview}>Submit Review</button>
          <button className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ShipperDashboard;