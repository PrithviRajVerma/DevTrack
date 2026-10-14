import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="center-screen">
      <div className="error-card">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page not found</h2>
        <p className="error-message">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
