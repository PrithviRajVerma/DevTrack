import React from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { Layers, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <Layers size={22} />
          </div>
          <span className="brand-title">DevTrack</span>
          <span className="brand-badge">Milestone 1</span>
        </div>

        {user && (
          <div className="navbar-user-section">
            <div className="user-info">
              <div className="user-avatar">
                <UserIcon size={16} />
              </div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="btn btn-outline btn-sm logout-btn"
              title="Sign out"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
