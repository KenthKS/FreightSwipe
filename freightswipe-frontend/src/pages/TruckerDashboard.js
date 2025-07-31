import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSprings, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

// TruckerDashboard component for managing available loads, matches, and reviews
const TruckerDashboard = () => {
  // State variables for different categories of loads and UI controls
  const [loads, setLoads] = useState([]); // Available loads for swiping
  const [matchedLoads, setMatchedLoads] = useState([]); // Loads that have been matched with a shipper
  const [acceptedLoads, setAcceptedLoads] = useState([]); // Loads accepted by the trucker, pending shipper confirmation
  const [declinedLoads, setDeclinedLoads] = useState([]); // Loads declined by the trucker
  const [inTransitLoads, setInTransitLoads] = useState([]); // Loads currently in transit
  const [completedLoads, setCompletedLoads] = useState([]); // Loads that have been completed
  const [error, setError] = useState(''); // State for displaying error messages
  const [showReviewForm, setShowReviewForm] = useState(false); // Controls visibility of the review form
  const [reviewLoadId, setReviewLoadId] = useState(null); // ID of the load being reviewed
  const [reviewRating, setReviewRating] = useState(5); // Rating for the review
  const [reviewComment, setReviewComment] = useState(''); // Comment for the review
  // State for swipe animation, stores cards that are flicked out
  const [gone] = useState(() => new Set());

  // Fetches loads available for the current trucker
  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/loads/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoads(response.data);
    } catch (err) {
      setError('Failed to fetch loads');
    }
  };

  // Fetches all matches related to the current trucker
  const fetchMatchedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMatches = response.data;
      const userId = localStorage.getItem('userId');

      // Filter for loads that are matched and confirmed by both parties
      setMatchedLoads(allMatches.filter(match => match.status === 'MATCHED' && match.load.status === 'MATCHED'));
      // Filter for loads accepted by the trucker, pending shipper confirmation
      setAcceptedLoads(allMatches.filter(match => match.status === 'PENDING' && match.truckerId === userId));
      // Filter for loads declined by the trucker
      setDeclinedLoads(allMatches.filter(match => match.status === 'REJECTED'));
      // Filter for loads currently in transit, where the current trucker is matched
      setInTransitLoads(allMatches.filter(match => match.status === 'MATCHED' && match.load.status === 'IN_TRANSIT' && match.truckerId === userId));
      // Filter for loads completed by the current trucker
      setCompletedLoads(allMatches.filter(match => match.status === 'MATCHED' && match.load && match.load.status === 'COMPLETED' && match.truckerId === userId));
    } catch (err) {
      setError('Failed to fetch matched loads');
    }
  };

  // Effect hook to fetch initial data when the component mounts
  useEffect(() => {
    fetchLoads();
    fetchMatchedLoads();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Spring animation configuration for swipeable cards
  const [props, api] = useSprings(loads.length, i => ({
    x: 0,
    rot: 0,
    scale: 1,
    config: { friction: 50, tension: 500 },
  }));

  // Gesture binding for swipeable cards
  const bind = useGesture({
    onDrag: ({ args: [index], down, movement: [mx], direction: [xDir], velocity: [vx], cancel }) => {
      const trigger = vx > 0.2; // If speed exceeds 0.2, trigger swipe
      if (!down && trigger) gone.add(index); // If button is released and speed is over the threshold, it's a swipe

      // Update the spring with new values for animation
      api.start(i => {
        if (index !== i) return; // Only animate the card being dragged
        const isGone = gone.has(index); // True when the card is swiped out
        // Calculate x position: fly out if gone, follow mouse if dragging, or reset to 0
        const x = isGone ? (200 + window.innerWidth) * xDir : down ? mx : 0;
        // Calculate rotation: proportional to x movement, or snap back if not dragging
        const rot = mx / 100 + (isGone ? xDir * 10 * vx : 0);
        // Scale up when dragging, reset to 1 otherwise
        const scale = down ? 1.1 : 1;
        return { x, rot, scale, delay: undefined, config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 } };
      });

      // If card is released and swiped out, handle the swipe action
      if (!down && gone.has(index)) {
        const loadId = loads[index].id;
        const direction = xDir > 0 ? 'right' : 'left';
        handleSwipe(direction, loadId);
      }
    },
  });

  // Handles the swipe action (accept or decline a load)
  const handleSwipe = async (direction, loadId) => {
    try {
      const token = localStorage.getItem('token');
      if (direction === 'right') {
        // Send request to accept the load
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/matches`, { loadId, status: 'PENDING', action: 'swipe' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (direction === 'left') {
        // Send request to decline the load
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/matches`, { loadId, status: 'REJECTED', action: 'swipe' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Remove the swiped card from the list of available loads
      setLoads(loads.filter(load => load.id !== loadId));
      fetchMatchedLoads(); // Re-fetch matched loads to update accepted/declined lists
    } catch (err) {
      console.error('Failed to swipe', err);
    }
  };

  // Handles updating the status of a load (e.g., from MATCHED to IN_TRANSIT, or IN_TRANSIT to COMPLETED)
  const handleUpdateLoadStatus = async (loadId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/loads/${loadId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLoads(); // Re-fetch available loads
      fetchMatchedLoads(); // Re-fetch matched loads to update all lists
    } catch (err) {
      console.error('Failed to update load status:', err);
      setError('Failed to update load status');
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
      setError('Rating must be between 1 and 5.');
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
      <h2>Trucker Dashboard</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className='cardContainer'>
        {props.map(({ x, rot, scale }, i) => (
          <animated.div
            className='swipe'
            key={loads[i].id}
            {...bind(i)}
            style={{
              transform: x.to((x) => `translateX(${x}px)`),
              rotateZ: rot.to((rot) => `${rot}deg`),
              scale: scale,
            }}
          >
            <div className='card'>
              <h3>{loads[i].origin} to {loads[i].destination}</h3>
              <p>Weight: {loads[i].weight} lbs</p>
              <p>Budget: ${loads[i].budget}</p>
              <p>Deadline: {new Date(loads[i].deadline).toLocaleDateString()}</p>
              <div className="d-flex justify-content-around mt-3">
                <button className="btn btn-success" onClick={() => handleSwipe('right', loads[i].id)}>Accept</button>
                <button className="btn btn-danger" onClick={() => handleSwipe('left', loads[i].id)}>Decline</button>
              </div>
            </div>
          </animated.div>
        ))}
      </div>

      <div className="mt-4">
        <h3>Matched Loads</h3>
        <ul className="list-group">
          {matchedLoads.length > 0 ? (
            matchedLoads.map(match => (
              <li key={match.id} className="list-group-item">
                <h5>Load: {match.load.origin} to {match.load.destination}</h5>
                <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
                <Link to={`/reviews/${match.shipper.id}`} className="btn btn-info btn-sm me-2">View Reviews</Link>
                <p>Status: {match.status}</p>
                {match.load.status === 'MATCHED' && !match.load.truckerInTransitConfirmed && (
                  <button className="btn btn-info btn-sm mt-2" onClick={() => handleUpdateLoadStatus(match.load.id, 'IN_TRANSIT')}>Mark as In Transit</button>
                )}
                {match.load.status === 'MATCHED' && match.load.truckerInTransitConfirmed && !match.load.shipperInTransitConfirmed && (
                  <p className="text-info mt-2">Waiting for Shipper to confirm In Transit</p>
                )}
                {match.load.status === 'MATCHED' && match.load.truckerInTransitConfirmed && match.load.shipperInTransitConfirmed && (
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
                <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
                <p>Status: {match.load.status}</p>
              </li>
            ))
          ) : (
            <li className="list-group-item">No loads in transit.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3>Accepted Loads (Pending Shipper Confirmation)</h3>
        <ul className="list-group">
          {acceptedLoads.length > 0 ? (
            acceptedLoads.map(match => (
              <li key={match.id} className="list-group-item">
                <h5>Load: {match.load.origin} to {match.load.destination}</h5>
                <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
                <p>Status: {match.status}</p>
              </li>
            ))
          ) : (
            <li className="list-group-item">No accepted loads yet.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3>Declined Loads</h3>
        <ul className="list-group">
          {declinedLoads.length > 0 ? (
            declinedLoads.map(match => (
              <li key={match.id} className="list-group-item">
                <h5>Load: {match.load.origin} to {match.load.destination}</h5>
                <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
                <p>Status: {match.status}</p>
              </li>
            ))
          ) : (
            <li className="list-group-item">No declined loads yet.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3>Completed Loads</h3>
        <ul className="list-group">
          {completedLoads.length > 0 ? (
            completedLoads.map(match => {
              const userId = localStorage.getItem('userId');
              const hasReviewed = match.load && match.load.reviews && Array.isArray(match.load.reviews) && match.load.reviews.some(review => review.reviewerId === userId);
              return (
                <li key={match.id} className="list-group-item">
                  <h5>Load: {match.load.origin} to {match.load.destination}</h5>
                  <p>Shipper: {match.shipper.name} ({match.shipper.email})</p>
                  <Link to={`/reviews/${match.shipper.id}`} className="btn btn-info btn-sm me-2">View Reviews</Link>
                  <p>Status: {match.load.status}</p>
                  {match.load.status === 'COMPLETED' && !hasReviewed && (
                    <button className="btn btn-primary btn-sm mt-2" onClick={() => handleReview(match.load.id)}>Leave Review</button>
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

export default TruckerDashboard;
