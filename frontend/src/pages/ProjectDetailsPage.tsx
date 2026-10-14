import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { getProject, listProjectMembers } from '../api/projects';
import { listProjectIssues, deleteIssue } from '../api/issues';
import { Project, ProjectMember } from '../types/project';
import { Issue, IssuePriority, IssueStatus, IssueType, PageResponse } from '../types/issue';
import { CreateIssueModal } from '../features/issues/CreateIssueModal';
import { EditIssueModal } from '../features/issues/EditIssueModal';
import { ManageMembersModal } from '../features/projects/ManageMembersModal';
import { KanbanBoard } from '../features/board/KanbanBoard';
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  Kanban,
  Table as TableIcon,
  ChevronRight,
} from 'lucide-react';
import { ApiException } from '../api/client';

export const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [issuesData, setIssuesData] = useState<PageResponse<Issue> | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<IssueStatus | ''>('');
  const [priority, setPriority] = useState<IssuePriority | ''>('');
  const [type, setType] = useState<IssueType | ''>('');
  const [overdue, setOverdue] = useState(false);
  const [page, setPage] = useState(0);

  // Modals state
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  const handleIssueUpdated = (updated: Issue) => {
    setIssuesData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        content: prev.content.map((i) => (i.id === updated.id ? updated : i)),
      };
    });
  };

  const loadProjectData = useCallback(async () => {
    setIsLoadingProject(true);
    setError(null);
    try {
      const [proj, mems] = await Promise.all([
        getProject(id),
        listProjectMembers(id),
      ]);
      setProject(proj);
      setMembers(mems);
    } catch (err: unknown) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Failed to load project details.');
    } finally {
      setIsLoadingProject(false);
    }
  }, [id]);

  const loadIssues = useCallback(async () => {
    setIsLoadingIssues(true);
    try {
      const data = await listProjectIssues(id, {
        search: search.trim() || undefined,
        status: status || undefined,
        priority: priority || undefined,
        type: type || undefined,
        overdue: overdue || undefined,
        page,
        size: viewMode === 'board' ? 50 : 15,
        sort: 'createdAt,desc',
      });
      setIssuesData(data);
    } catch (err: unknown) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Failed to load issues.');
    } finally {
      setIsLoadingIssues(false);
    }
  }, [id, search, status, priority, type, overdue, page, viewMode]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleDeleteIssue = async (issueId: number, issueKey: string) => {
    if (!window.confirm(`Are you sure you want to delete ${issueKey}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteIssue(issueId);
      loadIssues();
    } catch (err: unknown) {
      if (err instanceof ApiException) alert(`Failed to delete issue: ${err.message}`);
      else alert('Failed to delete issue.');
    }
  };

  const getAssigneeInitials = (name?: string) => {
    if (!name) return '—';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoadingProject) {
    return (
      <div className="layout-root">
        <Navbar />
        <main className="main-content">
          <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
            <p className="text-secondary">Loading workspace...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="layout-root">
        <Navbar />
        <main className="main-content">
          <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
            <div className="alert alert-error" style={{ maxWidth: 500, margin: '0 auto' }}>
              <AlertCircle size={18} />
              <span>{error || 'Project not found.'}</span>
            </div>
            <Link to="/projects" className="btn btn-outline" style={{ marginTop: '1rem' }}>
              <ArrowLeft size={16} /> Back to Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const issuesList = issuesData?.content || [];

  return (
    <div className="layout-root">
      <Navbar />

      <main className="main-content">
        <div className="container">
          {/* Breadcrumbs & Project Header */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="flex items-center gap-2 text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
              <Link to="/projects" className="text-secondary hover:underline">Projects</Link>
              <ChevronRight size={12} />
              <span className="font-mono text-main">{project.projectKey}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="badge-code font-mono" style={{ fontSize: '0.9rem', padding: '0.2rem 0.6rem' }}>
                  {project.projectKey}
                </span>
                <div>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                    {project.name}
                  </h1>
                  {project.description && (
                    <p className="text-xs text-secondary" style={{ marginTop: '0.15rem' }}>
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsManageMembersOpen(true)}
                  className="btn btn-secondary btn-sm"
                  title="Manage members"
                >
                  <Users size={14} />
                  <span>Members ({members.length})</span>
                </button>
                <button
                  onClick={() => setIsCreateIssueOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>New Issue</span>
                </button>
              </div>
            </div>
          </div>

          {/* Controls & Filter Toolbar */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              background: 'var(--bg-surface-1)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2" style={{ flex: 1 }}>
                <div style={{ position: 'relative', minWidth: 200, flex: 1, maxWidth: 320 }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.1rem', fontSize: '0.82rem' }}
                    placeholder="Search issues..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: 110, fontSize: '0.8rem' }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IssueStatus | '')}
                >
                  <option value="">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: 110, fontSize: '0.8rem' }}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority | '')}
                >
                  <option value="">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: 110, fontSize: '0.8rem' }}
                  value={type}
                  onChange={(e) => setType(e.target.value as IssueType | '')}
                >
                  <option value="">All Types</option>
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="FEATURE">Feature</option>
                </select>

                <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer" style={{ userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={overdue}
                    onChange={(e) => setOverdue(e.target.checked)}
                  />
                  <span>Overdue only</span>
                </label>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1" style={{ background: 'var(--bg-surface-2)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <button
                  className={`btn btn-sm ${viewMode === 'board' ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ border: 'none', padding: '0.3rem 0.65rem' }}
                  onClick={() => setViewMode('board')}
                  title="Kanban Board view"
                >
                  <Kanban size={14} />
                  <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  className={`btn btn-sm ${viewMode === 'table' ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ border: 'none', padding: '0.3rem 0.65rem' }}
                  onClick={() => setViewMode('table')}
                  title="Table List view"
                >
                  <TableIcon size={14} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area: Kanban Board or Table */}
          {isLoadingIssues ? (
            <div style={{ padding: '3rem 0', textAlign: 'center' }}>
              <p className="text-secondary text-sm">Loading issues...</p>
            </div>
          ) : viewMode === 'board' ? (
            <KanbanBoard
              issues={issuesList}
              onIssueClick={(issue) => setEditingIssue(issue)}
              onIssueUpdated={handleIssueUpdated}
              onRefreshNeeded={loadIssues}
            />
          ) : (
            /* Table View with Mobile Responsive Card Adaptability */
            <div className="table-container">
              {issuesList.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <p>No issues match the selected filter criteria.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 110 }}>Key</th>
                      <th>Title</th>
                      <th style={{ width: 110 }}>Status</th>
                      <th style={{ width: 100 }}>Priority</th>
                      <th style={{ width: 140 }}>Assignee</th>
                      <th style={{ width: 120 }}>Due Date</th>
                      <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesList.map((issue) => (
                      <tr
                        key={issue.id}
                        className="card-clickable"
                        onClick={() => setEditingIssue(issue)}
                      >
                        <td>
                          <span className="badge-code font-mono">{issue.key}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>
                            {issue.title}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${issue.status.toLowerCase().replace('_', '-')}`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${issue.priority.toLowerCase()}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td>
                          {issue.assignee ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="user-avatar"
                                style={{ width: 22, height: 22, fontSize: '0.65rem' }}
                              >
                                {getAssigneeInitials(issue.assignee.name)}
                              </div>
                              <span className="text-xs text-secondary">{issue.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          {issue.dueDate ? (
                            <span className="text-xs text-secondary flex items-center gap-1">
                              <Calendar size={12} />
                              {issue.dueDate}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="btn btn-outline btn-sm btn-icon"
                              onClick={() => setEditingIssue(issue)}
                              title="Edit Issue"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              onClick={() => handleDeleteIssue(issue.id, issue.key)}
                              title="Delete Issue"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {issuesData && issuesData.page && issuesData.page.totalPages > 1 && (
                <div className="flex items-center justify-between" style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs text-secondary">
                    Page {issuesData.page.number + 1} of {issuesData.page.totalPages} ({issuesData.page.totalElements} issues)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={issuesData.page.number === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={issuesData.page.number >= issuesData.page.totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) for 1-Tap Issue Creation */}
      <button
        className="mobile-fab-btn"
        onClick={() => setIsCreateIssueOpen(true)}
        aria-label="Create New Issue"
        title="Create New Issue"
      >
        <Plus size={24} />
      </button>

      {/* Modals */}
      <CreateIssueModal
        isOpen={isCreateIssueOpen}
        projectId={id}
        members={members}
        onClose={() => setIsCreateIssueOpen(false)}
        onSuccess={() => {
          setIsCreateIssueOpen(false);
          loadIssues();
        }}
      />

      <EditIssueModal
        isOpen={Boolean(editingIssue)}
        issue={editingIssue}
        members={members}
        isProjectOwner={project.currentUserRole === 'OWNER'}
        onClose={() => setEditingIssue(null)}
        onSuccess={(updated) => {
          handleIssueUpdated(updated);
          setEditingIssue(null);
          loadIssues();
        }}
      />

      <ManageMembersModal
        isOpen={isManageMembersOpen}
        project={project}
        onClose={() => setIsManageMembersOpen(false)}
        onMembersUpdated={() => loadProjectData()}
      />
    </div>
  );
};
