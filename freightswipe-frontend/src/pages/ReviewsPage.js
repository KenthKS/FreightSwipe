import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ReviewsPage = () => {
  const { userId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/reviews/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mt-4">
      <h2>Reviews</h2>
      <h4>Average Rating: {averageRating ? averageRating.toFixed(1) : 'N/A'}</h4>
      <div className="list-group">
        {reviews.map(review => (
          <div key={review.id} className="list-group-item">
            <h5>Rating: {review.rating}/5</h5>
            <p>{review.comment}</p>
            <small>By: {review.reviewer.name} ({review.reviewer.role})</small>
            <br />
            <small>For Load: {review.load.origin.address}, {review.load.origin.city}, {review.load.origin.province} to {review.load.destination.address}, {review.load.destination.city}, {review.load.destination.province}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsPage;
