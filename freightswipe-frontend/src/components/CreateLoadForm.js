
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * A form component for creating new loads.
 * @param {object} props - The component's props.
 * @param {function} props.onNewLoad - A callback function to be invoked when a new load is created.
 */
const CreateLoadForm = ({ onNewLoad }) => {
  // State variables for form inputs and messages
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Refs for Google Maps Autocomplete inputs
  const originRef = useRef(null);
  const destinationRef = useRef(null);

  // Effect to initialize Google Maps Autocomplete
  useEffect(() => {
    // Create autocomplete instances for origin and destination inputs
    const autocompleteOrigin = new window.google.maps.places.Autocomplete(originRef.current);
    const autocompleteDestination = new window.google.maps.places.Autocomplete(destinationRef.current);

    // Add listeners for when a place is selected from the autocomplete dropdown
    autocompleteOrigin.addListener('place_changed', () => {
      const place = autocompleteOrigin.getPlace();
      setOrigin(place.formatted_address);
    });

    autocompleteDestination.addListener('place_changed', () => {
      const place = autocompleteDestination.getPlace();
      setDestination(place.formatted_address);
    });
  }, []);

  /**
   * Handles the form submission for creating a new load.
   * @param {object} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Form Validation ---

    // Prevent submission if origin and destination are the same
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Origin and destination cannot be the same.');
      return;
    }

    // Validate that weight is a positive number
    if (parseFloat(weight) <= 0) {
      setError('Weight must be a positive number.');
      return;
    }

    // Validate that budget is a positive number
    if (parseFloat(budget) <= 0) {
      setError('Budget must be a positive number.');
      return;
    }

    // Validate that the deadline is not in the past
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

    // --- API Request ---

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

      // Invoke the callback and reset the form on success
      onNewLoad(response.data);
      setOrigin('');
      setDestination('');
      setWeight('');
      setBudget('');
      setDeadline('');
      setDescription('');
      setSuccess('Load Created Successfully!');
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      // Set an error message if the API request fails
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
