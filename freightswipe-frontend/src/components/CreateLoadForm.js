
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const CreateLoadForm = ({ onNewLoad }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const originRef = useRef(null);
  const destinationRef = useRef(null);

  useEffect(() => {
    const autocompleteOrigin = new window.google.maps.places.Autocomplete(originRef.current);
    const autocompleteDestination = new window.google.maps.places.Autocomplete(destinationRef.current);

    autocompleteOrigin.addListener('place_changed', () => {
      const place = autocompleteOrigin.getPlace();
      setOrigin(place.formatted_address);
    });

    autocompleteDestination.addListener('place_changed', () => {
      const place = autocompleteDestination.getPlace();
      setDestination(place.formatted_address);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Origin and destination cannot be the same.');
      return;
    }

    if (parseFloat(weight) <= 0) {
      setError('Weight must be a positive number.');
      return;
    }

    if (parseFloat(budget) <= 0) {
      setError('Budget must be a positive number.');
      return;
    }

    const deadlineParts = deadline.split('-');
    const selectedDate = new Date(
      parseInt(deadlineParts[0], 10),
      parseInt(deadlineParts[1], 10) - 1,
      parseInt(deadlineParts[2], 10)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError('Deadline cannot be in the past.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/loads`, {
        origin,
        destination,
        weight: parseFloat(weight),
        budget: parseFloat(budget),
        deadline: selectedDate.toISOString(),
        description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onNewLoad(response.data);
      setOrigin('');
      setDestination('');
      setWeight('');
      setBudget('');
      setDeadline('');
      setDescription('');
      setSuccess('Load Created Successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create load');
      setSuccess('');
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">Create New Load</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-primary">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Origin</label>
            <input
              ref={originRef}
              type="text"
              className="form-control"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Destination</label>
            <input
              ref={destinationRef}
              type="text"
              className="form-control"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Weight (lbs)</label>
            <input
              type="number"
              className="form-control"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Budget ($)</label>
            <input
              type="number"
              className="form-control"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Deadline</label>
            <input
              type="date"
              className="form-control"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Create Load</button>
        </form>
      </div>
    </div>
  );
};

export default CreateLoadForm;
