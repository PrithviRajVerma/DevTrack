import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Layers, LogOut, User as UserIcon, LayoutDashboard, FolderGit2 } from 'lucide-react';

import { NotificationDropdown } from '../features/notifications/NotificationDropdown';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isCurrent = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon">
              <Layers size={22} />
            </div>
            <span className="brand-title">DevTrack</span>
          </Link>

          {user && (
            <nav className="navbar-nav">
              <Link
                to="/"
                className={`nav-link ${isCurrent('/') ? 'nav-link-active' : ''}`}
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                to="/projects"
                className={`nav-link ${isCurrent('/projects') ? 'nav-link-active' : ''}`}
              >
                <FolderGit2 size={16} /> Projects
              </Link>
            </nav>
          )}
        </div>

        {user && (
          <div className="navbar-user-section flex items-center space-x-3">
            <NotificationDropdown />

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
