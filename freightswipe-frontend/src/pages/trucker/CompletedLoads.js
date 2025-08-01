import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CompletedLoads = () => {
  const [completedLoads, setCompletedLoads] = useState([]);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewLoadId, setReviewLoadId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const fetchCompletedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMatches = response.data;
      const userId = localStorage.getItem('userId');
      setCompletedLoads(allMatches.filter(match => match.status === 'MATCHED' && match.load && match.load.status === 'COMPLETED' && match.truckerId === userId));
    } catch (err) {
      setError('Failed to fetch completed loads');
    }
  };

  useEffect(() => {
    fetchCompletedLoads();
  }, []);

  const handleReview = (loadId) => {
    setReviewLoadId(loadId);
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) {
      setError('Rating must be between 1 and 5.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/reviews`, { loadId: reviewLoadId, rating: parseInt(reviewRating), comment: reviewComment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowReviewForm(false);
      setReviewLoadId(null);
      setReviewRating(5);
      setReviewComment('');
      setError('');
      fetchCompletedLoads();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Completed Loads</h2>
      {error && <div className="alert alert-danger">{error}</div>}
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
          <div>
            <p>No completed loads yet.</p>
            <Link to="/trucker/available-loads" className="btn btn-primary">Find Loads</Link>
          </div>
        )}
      </ul>

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

export default CompletedLoads;
