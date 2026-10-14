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
  User as UserIcon,
  Clock,
  LayoutGrid,
  List,
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
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

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
        size: 15,
        sort: 'createdAt,desc',
      });
      setIssuesData(data);
    } catch (err: unknown) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Failed to load issues.');
    } finally {
      setIsLoadingIssues(false);
    }
  }, [id, search, status, priority, type, overdue, page]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleDeleteIssue = async (issueId: number) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await deleteIssue(issueId);
      await loadIssues();
    } catch (err: unknown) {
      if (err instanceof ApiException) alert(err.message);
      else alert('Failed to delete issue.');
    }
  };

  if (isLoadingProject) {
    return (
      <div className="layout-root">
        <Navbar />
        <div className="center-screen">
          <div className="spinner"></div>
          <p className="loading-text">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="layout-root">
        <Navbar />
        <div className="container py-8">
          <div className="alert alert-error">Project not found or access denied.</div>
          <Link to="/projects" className="btn btn-primary mt-4">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-root">
      <Navbar />

      <main className="main-content">
        <div className="container">
          <div className="mb-4">
            <Link to="/projects" className="back-link">
              <ArrowLeft size={16} /> All Projects
            </Link>
          </div>

          <div className="project-detail-header">
            <div>
              <div className="project-badge-row">
                <span className="badge badge-primary font-mono">{project.projectKey}</span>
                <span className="badge badge-subtle">{project.currentUserRole}</span>
              </div>
              <h1 className="project-page-title">{project.name}</h1>
              {project.description && (
                <p className="project-page-description">{project.description}</p>
              )}
            </div>

            <div className="project-actions">
              <button
                onClick={() => setIsManageMembersOpen(true)}
                className="btn btn-outline"
              >
                <Users size={16} /> Members ({members.length})
              </button>
              <button
                onClick={() => setIsCreateIssueOpen(true)}
                className="btn btn-primary"
              >
                <Plus size={16} /> New Issue
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search issues by title or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div className="filter-selects">
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as IssueStatus | '');
                  setPage(0);
                }}
              >
                <option value="">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>

              <select
                className="form-select form-select-sm"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as IssuePriority | '');
                  setPage(0);
                }}
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              <select
                className="form-select form-select-sm"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as IssueType | '');
                  setPage(0);
                }}
              >
                <option value="">All Types</option>
                <option value="TASK">Task</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
              </select>

              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={overdue}
                  onChange={(e) => {
                    setOverdue(e.target.checked);
                    setPage(0);
                  }}
                />
                <Clock size={14} /> Overdue
              </label>

              <div className="flex items-center space-x-1 border border-border rounded-md p-0.5 ml-auto">
                <button
                  type="button"
                  className={`btn-icon p-1.5 rounded ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
                  title="Table view"
                  onClick={() => setViewMode('table')}
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  className={`btn-icon p-1.5 rounded ${viewMode === 'board' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
                  title="Kanban Board view"
                  onClick={() => setViewMode('board')}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="issues-container">
            {isLoadingIssues ? (
              <div className="loading-state">
                <div className="spinner-sm"></div>
                <span>Filtering issues...</span>
              </div>
            ) : !issuesData || issuesData.content.length === 0 ? (
              <div className="empty-state-card">
                <p className="empty-state-title">No issues found</p>
                <p className="empty-state-description">
                  No issues match your current filters. Create a new issue or adjust your search.
                </p>
                <button
                  onClick={() => setIsCreateIssueOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} /> Create Issue
                </button>
              </div>
            ) : viewMode === 'board' ? (
              <KanbanBoard
                issues={issuesData.content}
                onIssueClick={(issue) => setEditingIssue(issue)}
                onIssueUpdated={handleIssueUpdated}
                onRefreshNeeded={loadIssues}
              />
            ) : (
              <div className="table-responsive">
                <table className="issues-table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesData.content.map((issue) => {
                      const isOverdue =
                        issue.dueDate &&
                        new Date(issue.dueDate) < new Date() &&
                        issue.status !== 'DONE';

                      return (
                        <tr key={issue.id} className="issue-row">
                          <td className="font-mono font-bold text-primary">{issue.key}</td>
                          <td className="issue-title-cell">
                            <span className="issue-title-text">{issue.title}</span>
                          </td>
                          <td>
                            <span className={`badge badge-type badge-type-${issue.type.toLowerCase()}`}>
                              {issue.type}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-priority badge-priority-${issue.priority.toLowerCase()}`}>
                              {issue.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-status badge-status-${issue.status.toLowerCase()}`}>
                              {issue.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            {issue.assignee ? (
                              <div className="assignee-badge" title={issue.assignee.email}>
                                <div className="assignee-avatar">
                                  <UserIcon size={12} />
                                </div>
                                <span>{issue.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted text-sm">Unassigned</span>
                            )}
                          </td>
                          <td>
                            {issue.dueDate ? (
                              <span className={`date-badge ${isOverdue ? 'date-badge-overdue' : ''}`}>
                                <Calendar size={12} /> {issue.dueDate}
                              </span>
                            ) : (
                              <span className="text-muted text-sm">—</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="btn-icon"
                                title="Edit issue"
                                onClick={() => setEditingIssue(issue)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon btn-icon-danger"
                                title="Delete issue"
                                onClick={() => handleDeleteIssue(issue.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {issuesData && issuesData.page.totalPages > 1 && (
              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing {issuesData.page.number * issuesData.page.size + 1} to{' '}
                  {Math.min(
                    (issuesData.page.number + 1) * issuesData.page.size,
                    issuesData.page.totalElements
                  )}{' '}
                  of {issuesData.page.totalElements} issues
                </span>

                <div className="pagination-buttons">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="page-current">
                    Page {issuesData.page.number + 1} of {issuesData.page.totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page >= issuesData.page.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateIssueModal
        isOpen={isCreateIssueOpen}
        projectId={id}
        members={members}
        onClose={() => setIsCreateIssueOpen(false)}
        onSuccess={() => loadIssues()}
      />

      <EditIssueModal
        isOpen={!!editingIssue}
        issue={editingIssue}
        members={members}
        isProjectOwner={project.currentUserRole === 'OWNER'}
        onClose={() => setEditingIssue(null)}
        onSuccess={() => {
          setEditingIssue(null);
          loadIssues();
        }}
      />

      <ManageMembersModal
        isOpen={isManageMembersOpen}
        project={project}
        onClose={() => setIsManageMembersOpen(false)}
        onMembersUpdated={loadProjectData}
      />
    </div>
  );
};
