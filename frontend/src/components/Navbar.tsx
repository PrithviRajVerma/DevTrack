import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  Layers,
  LogOut,
  LayoutDashboard,
  FolderGit2,
} from 'lucide-react';
import { NotificationDropdown } from '../features/notifications/NotificationDropdown';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isCurrent = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Top Main Navigation Header */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <Link to="/" className="navbar-brand">
              <div className="brand-icon">
                <Layers size={18} />
              </div>
              <span className="brand-title">DevTrack</span>
              <span className="brand-badge">Core</span>
            </Link>

            {user && (
              <nav className="navbar-nav">
                <Link
                  to="/"
                  className={`nav-link ${isCurrent('/') ? 'nav-link-active' : ''}`}
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/projects"
                  className={`nav-link ${isCurrent('/projects') ? 'nav-link-active' : ''}`}
                >
                  <FolderGit2 size={15} />
                  <span>Projects</span>
                </Link>
              </nav>
            )}
          </div>

          {user && (
            <div className="navbar-user-section">
              <NotificationDropdown />

              <div className="user-info">
                <div className="user-avatar" title={user.name}>
                  {getInitials(user.name)}
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
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Dock (Visible on Mobile < 768px) */}
      {user && (
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <Link
            to="/"
            className={`mobile-nav-item ${isCurrent('/') ? 'mobile-nav-item-active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/projects"
            className={`mobile-nav-item ${isCurrent('/projects') ? 'mobile-nav-item-active' : ''}`}
          >
            <FolderGit2 size={18} />
            <span>Projects</span>
          </Link>

          <button
            onClick={() => logout()}
            className="mobile-nav-item"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </nav>
      )}
    </>
  );
};
