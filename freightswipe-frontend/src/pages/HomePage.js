
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="container text-center mt-5">
      <h1>Welcome to FreightSwipe</h1>
      <p>The future of freight matching.</p>
      <div className="mt-4">
        <Link to="/login" className="btn btn-primary me-2">Login</Link>
        <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
      </div>
    </div>
  );
};

export default HomePage;
