import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { listProjects } from '../api/projects';
import { Project } from '../types/project';
import { CreateProjectModal } from '../features/projects/CreateProjectModal';
import {
  FolderPlus,
  Users,
  Calendar,
  ArrowRight,
  Shield,
  AlertCircle,
  Search,
  Plus,
  FolderGit2,
} from 'lucide-react';
import { ApiException } from '../api/client';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'MEMBER'>('ALL');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (err: unknown) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'OWNER' && p.currentUserRole === 'OWNER') ||
      (roleFilter === 'MEMBER' && p.currentUserRole !== 'OWNER');

    return matchesSearch && matchesRole;
  });

  const ownedCount = projects.filter((p) => p.currentUserRole === 'OWNER').length;
  const memberCount = projects.length - ownedCount;

  return (
    <div className="layout-root">
      <Navbar />

      <main className="main-content">
        <div className="container">
          {/* Header row */}
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Your Workspaces</h1>
              <p className="page-description">
                Organize projects, manage team permissions, and monitor active sprint boards.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary"
            >
              <FolderPlus size={16} /> New Workspace
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div
            className="card"
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              background: 'var(--bg-surface-1)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.1rem', fontSize: '0.82rem' }}
                  placeholder="Filter workspaces by title or key..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Role Filter Tabs */}
              <div
                className="flex items-center gap-1"
                style={{
                  background: 'var(--bg-surface-2)',
                  padding: '0.2rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  className={`btn btn-sm ${roleFilter === 'ALL' ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ border: 'none', padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                  onClick={() => setRoleFilter('ALL')}
                >
                  All ({projects.length})
                </button>
                <button
                  className={`btn btn-sm ${roleFilter === 'OWNER' ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ border: 'none', padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                  onClick={() => setRoleFilter('OWNER')}
                >
                  Owned ({ownedCount})
                </button>
                <button
                  className={`btn btn-sm ${roleFilter === 'MEMBER' ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ border: 'none', padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                  onClick={() => setRoleFilter('MEMBER')}
                >
                  Member ({memberCount})
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p className="loading-text">Loading workspaces...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <FolderGit2 size={36} />
              </div>
              <h3 className="empty-state-title">No workspaces found</h3>
              <p className="empty-state-description">
                Create your first project workspace to start tracking issues, organizing sprints, and collaborating with your team.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-primary"
              >
                <FolderPlus size={16} /> Create Workspace
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state-card" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-state-icon">
                <Search size={30} />
              </div>
              <h3 className="empty-state-title">No matching workspaces</h3>
              <p className="empty-state-description">
                No workspaces matched "{searchQuery}". Try a different keyword or reset filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                }}
                className="btn btn-secondary btn-sm"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="card project-card"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/projects/${project.id}`);
                  }}
                >
                  <div className="card-header project-card-header">
                    <span className="badge-code font-mono">{project.projectKey}</span>
                    <span className={`badge ${project.currentUserRole === 'OWNER' ? 'badge-primary' : 'badge-subtle'}`}>
                      {project.currentUserRole === 'OWNER' && <Shield size={12} />}
                      {project.currentUserRole}
                    </span>
                  </div>

                  <div className="card-body">
                    <h3 className="project-title">{project.name}</h3>
                    <p className="project-description">
                      {project.description || 'No description provided for this workspace.'}
                    </p>

                    <div className="project-footer">
                      <div className="project-meta">
                        <span className="meta-badge" title="Members count">
                          <Users size={13} /> {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        <span className="meta-badge" title="Created date">
                          <Calendar size={13} /> {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="card-link-arrow">
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        className="mobile-fab-btn"
        onClick={() => setIsCreateOpen(true)}
        aria-label="Create New Workspace"
        title="Create New Workspace"
      >
        <Plus size={24} />
      </button>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          navigate(`/projects/${newProj.id}`);
        }}
      />
    </div>
  );
};
