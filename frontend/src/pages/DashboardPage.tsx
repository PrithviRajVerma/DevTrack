import React from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { Navbar } from '../components/Navbar';
import { CheckCircle2, ShieldCheck, Database, FolderPlus, ArrowRight, UserCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="layout-root">
      <Navbar />

      <main className="main-content">
        <div className="container">
          <section className="welcome-banner">
            <div className="welcome-header">
              <span className="badge badge-success">
                <CheckCircle2 size={14} /> Foundation Active
              </span>
              <h1 className="page-title">Welcome back, {user?.name || 'Developer'}!</h1>
              <p className="page-description">
                DevTrack Milestone 1 foundation is operational. Authentication, session management, and database migrations are fully configured.
              </p>
            </div>
          </section>

          <div className="grid-cards">
            <div className="card">
              <div className="card-header">
                <div className="card-icon icon-blue">
                  <UserCheck size={20} />
                </div>
                <h2 className="card-title">User Profile</h2>
              </div>
              <div className="card-body">
                <div className="meta-list">
                  <div className="meta-item">
                    <span className="meta-label">User ID:</span>
                    <span className="meta-value font-mono">#{user?.id}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Name:</span>
                    <span className="meta-value">{user?.name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Email:</span>
                    <span className="meta-value">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-icon icon-green">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="card-title">Security & Session</h2>
              </div>
              <div className="card-body">
                <div className="meta-list">
                  <div className="meta-item">
                    <span className="meta-label">Auth Mechanism:</span>
                    <span className="meta-value">HttpOnly Cookie + JWT</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Password Hash:</span>
                    <span className="meta-value">BCrypt Adaptive</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Endpoints:</span>
                    <span className="meta-value">Server-side Authorized</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-icon icon-purple">
                  <Database size={20} />
                </div>
                <h2 className="card-title">Database & Migrations</h2>
              </div>
              <div className="card-body">
                <div className="meta-list">
                  <div className="meta-item">
                    <span className="meta-label">Engine:</span>
                    <span className="meta-value">PostgreSQL</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Migration Tool:</span>
                    <span className="meta-value">Flyway (V1)</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Tables:</span>
                    <span className="meta-value">users, projects, members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="roadmap-card">
            <div className="roadmap-icon">
              <FolderPlus size={28} />
            </div>
            <div className="roadmap-content">
              <span className="badge badge-primary">Up Next</span>
              <h3 className="roadmap-title">Milestone 2: Project & Issue Management</h3>
              <p className="roadmap-description">
                Next capabilities: Create and manage workspaces/projects, project member roles (OWNER, MEMBER), issue CRUD, filtering, pagination, and optimistic locking concurrency guards.
              </p>
            </div>
            <div className="roadmap-action">
              <span className="roadmap-indicator">
                Ready <ArrowRight size={16} />
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
