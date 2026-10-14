import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { listProjects } from '../api/projects';
import { Project } from '../types/project';
import { CreateProjectModal } from '../features/projects/CreateProjectModal';
import { FolderPlus, Users, Calendar, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { ApiException } from '../api/client';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  return (
    <div className="layout-root">
      <Navbar />

      <main className="main-content">
        <div className="container">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Your Projects</h1>
              <p className="page-description">Manage your team's workspaces, issues, and permissions.</p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary"
            >
              <FolderPlus size={18} /> New Project
            </button>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p className="loading-text">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <FolderPlus size={36} />
              </div>
              <h3 className="empty-state-title">No projects yet</h3>
              <p className="empty-state-description">
                Create your first project workspace to start tracking issues, organizing sprints, and collaborating with your team.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-primary"
              >
                <FolderPlus size={18} /> Create First Project
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {projects.map((project) => (
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
                    <span className="badge badge-primary font-mono">{project.projectKey}</span>
                    <span className={`badge ${project.currentUserRole === 'OWNER' ? 'badge-primary' : 'badge-subtle'}`}>
                      {project.currentUserRole === 'OWNER' && <Shield size={12} />}
                      {project.currentUserRole}
                    </span>
                  </div>

                  <div className="card-body">
                    <h3 className="project-title">{project.name}</h3>
                    <p className="project-description">
                      {project.description || 'No description provided.'}
                    </p>

                    <div className="project-footer">
                      <div className="project-meta">
                        <span className="meta-badge" title="Members count">
                          <Users size={14} /> {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        <span className="meta-badge" title="Created date">
                          <Calendar size={14} /> {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="card-link-arrow">
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
