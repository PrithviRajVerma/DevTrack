import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FolderGit2, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="center-screen" style={{ minHeight: '100vh', background: 'var(--bg-canvas)', padding: '1.5rem' }}>
      <div
        className="card"
        style={{
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--color-primary-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Compass size={28} />
        </div>

        <div>
          <span className="badge-code font-mono" style={{ fontSize: '0.85rem', padding: '0.2rem 0.6rem' }}>
            HTTP 404
          </span>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.6rem' }}>
            Resource Not Found
          </h1>
          <p className="text-xs text-secondary" style={{ marginTop: '0.35rem', lineHeight: 1.5 }}>
            The page or workspace issue you are looking for does not exist, has been deleted, or requires elevated permissions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary btn-sm">
            <Home size={14} />
            <span>Dashboard</span>
          </Link>
          <Link to="/projects" className="btn btn-outline btn-sm">
            <FolderGit2 size={14} />
            <span>Workspaces</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
