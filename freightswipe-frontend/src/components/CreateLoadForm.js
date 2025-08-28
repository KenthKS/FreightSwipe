
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const CreateLoadForm = ({ onNewLoad }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [originStreet, setOriginStreet] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [originPostalCode, setOriginPostalCode] = useState('');
  const [originCountry, setOriginCountry] = useState('');

  const [destinationStreet, setDestinationStreet] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationProvince, setDestinationProvince] = useState('');
  const [destinationPostalCode, setDestinationPostalCode] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');

  const [weight, setWeight] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const originAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);

  const handleOriginPlaceChanged = () => {
    const place = originAutocompleteRef.current.getPlace();
    fillInAddress(place, setOriginStreet, setOriginCity, setOriginProvince, setOriginPostalCode, setOriginCountry);
  };

  const handleDestinationPlaceChanged = () => {
    const place = destinationAutocompleteRef.current.getPlace();
    fillInAddress(place, setDestinationStreet, setDestinationCity, setDestinationProvince, setDestinationPostalCode, setDestinationCountry);
  };

  const fillInAddress = (place, setStreet, setCity, setProvince, setPostalCode, setCountry) => {
    if (!place) return; // Add this check
    let street_number = '';
    let route = '';
    let city = '';
    let province = '';
    let postal_code = '';
    let country = '';

    if (place.address_components) {
      for (const component of place.address_components) {
        const type = component.types[0];
        switch (type) {
          case 'street_number':
            street_number = component.long_name || '';
            break;
          case 'route':
            route = component.long_name || '';
            break;
          case 'locality':
            city = component.long_name || '';
            break;
          case 'administrative_area_level_1':
            province = component.short_name || '';
            break;
          case 'postal_code':
            postal_code = component.long_name || '';
            break;
          case 'country':
            country = component.long_name || '';
            break;
          default:
            break;
        }
      }
    }

    setStreet(`${street_number} ${route}`.trim());
    setCity(city);
    setProvince(province);
    setPostalCode(postal_code);
    setCountry(country);
  };

  const ensureString = (value) => {
    return value != null ? String(value).trim() : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const originData = {
      address: ensureString(originStreet),
      city: ensureString(originCity),
      province: ensureString(originProvince),
      postalCode: ensureString(originPostalCode),
      country: ensureString(originCountry)
    };

    const destinationData = {
      address: ensureString(destinationStreet),
      city: ensureString(destinationCity),
      province: ensureString(destinationProvince),
      postalCode: ensureString(destinationPostalCode),
      country: ensureString(destinationCountry)
    };

    if (!originData.address || !originData.city || !originData.province || !originData.postalCode || !originData.country) {
      setError('All origin address fields are required.');
      return;
    }

    if (!destinationData.address || !destinationData.city || !destinationData.province || !destinationData.postalCode || !destinationData.country) {
      setError('All destination address fields are required.');
      return;
    }

    if (originData.address.toLowerCase() === destinationData.address.toLowerCase() &&
        originData.city.toLowerCase() === destinationData.city.toLowerCase() &&
        originData.province.toLowerCase() === destinationData.province.toLowerCase() &&
        originData.postalCode.toLowerCase() === destinationData.postalCode.toLowerCase() &&
        originData.country.toLowerCase() === destinationData.country.toLowerCase()) {
      setError('Origin and destination cannot be the same.');
      return;
    }

    if (!weight || parseFloat(weight) <= 0) {
      setError('Weight must be a positive number.');
      return;
    }

    if (!budget || parseFloat(budget) <= 0) {
      setError('Budget must be a positive number.');
      return;
    }

    if (!deadline) {
      setError('Deadline is required.');
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
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/loads`, {
        origin: originData,
        destination: destinationData,
        weight: parseFloat(weight),
        budget: parseFloat(budget),
        deadline: selectedDate.toISOString(),
        description: ensureString(description)
      }, { withCredentials: true });

      onNewLoad(response.data);
      setOriginStreet('');
      setOriginCity('');
      setOriginProvince('');
      setOriginPostalCode('');
      setOriginCountry('');
      setDestinationStreet('');
      setDestinationCity('');
      setDestinationProvince('');
      setDestinationPostalCode('');
      setDestinationCountry('');
      setWeight('');
      setBudget('');
      setDeadline('');
      setDescription('');
      setSuccess('Load Created Successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating load:', err);
      setError(err.response?.data?.error || 'Failed to create load');
      setSuccess('');
    }
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">Create New Load</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-primary">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Origin Address</label>
            <Autocomplete
              onLoad={(ref) => (originAutocompleteRef.current = ref)}
              onPlaceChanged={handleOriginPlaceChanged}
            >
              <input
                type="text"
                className="form-control"
                value={originStreet}
                onChange={(e) => setOriginStreet(e.target.value)}
                required
              />
            </Autocomplete>
          </div>
          <div className="mb-3">
            <label className="form-label">Origin City</label>
            <input
              type="text"
              className="form-control"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Origin State/Province</label>
            <input
              type="text"
              className="form-control"
              value={originProvince}
              onChange={(e) => setOriginProvince(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Origin Postal Code</label>
            <input
              type="text"
              className="form-control"
              value={originPostalCode}
              onChange={(e) => setOriginPostalCode(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Origin Country</label>
            <input
              type="text"
              className="form-control"
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Destination Address</label>
            <Autocomplete
              onLoad={(ref) => (destinationAutocompleteRef.current = ref)}
              onPlaceChanged={handleDestinationPlaceChanged}
            >
              <input
                type="text"
                className="form-control"
                value={destinationStreet}
                onChange={(e) => setDestinationStreet(e.target.value)}
                required
              />
            </Autocomplete>
          </div>
          <div className="mb-3">
            <label className="form-label">Destination City</label>
            <input
              type="text"
              className="form-control"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Destination State/Province</label>
            <input
              type="text"
              className="form-control"
              value={destinationProvince}
              onChange={(e) => setDestinationProvince(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Destination Postal Code</label>
            <input
              type="text"
              className="form-control"
              value={destinationPostalCode}
              onChange={(e) => setDestinationPostalCode(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Destination Country</label>
            <input
              type="text"
              className="form-control"
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
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
