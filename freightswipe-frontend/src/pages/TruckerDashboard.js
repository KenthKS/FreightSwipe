
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSprings, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

const TruckerDashboard = () => {
  const [loads, setLoads] = useState([]);
  const [matchedLoads, setMatchedLoads] = useState([]);
  const [acceptedLoads, setAcceptedLoads] = useState([]);
  const [declinedLoads, setDeclinedLoads] = useState([]);
  const [error, setError] = useState('');
  const [gone] = useState(() => new Set()); // The set stores all the cards that are flicked out

  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/loads/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoads(response.data);
    } catch (err) {
      setError('Failed to fetch loads');
    }
  };

  const fetchMatchedLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMatches = response.data;
      setMatchedLoads(allMatches.filter(match => match.status === 'MATCHED'));
      setAcceptedLoads(allMatches.filter(match => match.status === 'PENDING')); // Assuming PENDING means accepted by trucker, waiting for shipper
      setDeclinedLoads(allMatches.filter(match => match.status === 'REJECTED'));
    } catch (err) {
      setError('Failed to fetch matched loads');
    }
  };

  useEffect(() => {
    fetchLoads();
    fetchMatchedLoads();
  }, []);

  const [props, api] = useSprings(loads.length, i => ({
    x: 0,
    rot: 0,
    scale: 1,
    config: { friction: 50, tension: 500 },
  }));

  const bind = useGesture({
    onDrag: ({ args: [index], down, movement: [mx], direction: [xDir], velocity: [vx], cancel }) => {
      const trigger = vx > 0.2; // If speed exceeds 0.2, trigger swipe
      if (!down && trigger) gone.add(index); // If button is released and speed is over the threshold, it's a swipe

      // Update the spring with new values
      api.start(i => {
        if (index !== i) return; // We're only interested in the card being dragged
        const isGone = gone.has(index); // True when the card is gone
        const x = isGone ? (200 + window.innerWidth) * xDir : down ? mx : 0; // When a card is gone it flys out, otherwise it sticks to the mouse
        const rot = mx / 100 + (isGone ? xDir * 10 * vx : 0); // Rotate the card as it moves
        const scale = down ? 1.1 : 1; // Scale the card up when it's dragged
        return { x, rot, scale, delay: undefined, config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 } };
      });

      if (!down && gone.has(index)) {
        const loadId = loads[index].id;
        const direction = xDir > 0 ? 'right' : 'left';
        handleSwipe(direction, loadId);
      }
    },
  });

  const handleSwipe = async (direction, loadId) => {
    console.log(`Swiping load ${loadId} in direction: ${direction}`);
    try {
      const token = localStorage.getItem('token');
      if (direction === 'right') {
        console.log('Sending POST request to /matches with status PENDING');
        await axios.post('http://localhost:3001/matches', { loadId, status: 'PENDING', action: 'swipe' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (direction === 'left') {
        console.log('Sending POST request to /matches with status REJECTED');
        await axios.post('http://localhost:3001/matches', { loadId, status: 'REJECTED', action: 'swipe' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Remove the swiped card from the list
      setLoads(loads.filter(load => load.id !== loadId));
      console.log('Load removed from frontend state.');
      fetchMatchedLoads(); // Re-fetch matched loads to update accepted/declined lists
    } catch (err) {
      console.error('Failed to swipe', err);
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
                <p>Status: {match.status}</p>
              </li>
            ))
          ) : (
            <li className="list-group-item">No matched loads yet.</li>
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
    </div>
  );
};

export default TruckerDashboard;
