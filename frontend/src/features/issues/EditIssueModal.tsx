import React, { useState, useEffect } from 'react';
import { X, AlertCircle, RefreshCw, MessageSquare, History, FileText } from 'lucide-react';
import { updateIssue, getIssue } from '../../api/issues';
import { ApiException } from '../../api/client';
import { Issue, IssuePriority, IssueStatus, IssueType } from '../../types/issue';
import { ProjectMember } from '../../types/project';
import { CommentsSection } from '../comments/CommentsSection';
import { ActivityTimeline } from '../activity/ActivityTimeline';

interface Props {
  isOpen: boolean;
  issue: Issue | null;
  members: ProjectMember[];
  isProjectOwner?: boolean;
  onClose: () => void;
  onSuccess: (updatedIssue: Issue) => void;
}

export const EditIssueModal: React.FC<Props> = ({
  isOpen,
  issue,
  members,
  isProjectOwner = false,
  onClose,
  onSuccess,
}) => {
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(issue);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('TASK');
  const [status, setStatus] = useState<IssueStatus>('TODO');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (issue) {
      setCurrentIssue(issue);
      setTitle(issue.title);
      setDescription(issue.description || '');
      setType(issue.type);
      setStatus(issue.status);
      setPriority(issue.priority);
      setAssigneeId(issue.assignee?.id);
      setDueDate(issue.dueDate || '');
      setError(null);
      setIsConflict(false);
      setActiveTab('details');
    }
  }, [issue]);

  if (!isOpen || !currentIssue) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getIssue(currentIssue.id);
      setCurrentIssue(fresh);
      setTitle(fresh.title);
      setDescription(fresh.description || '');
      setType(fresh.type);
      setStatus(fresh.status);
      setPriority(fresh.priority);
      setAssigneeId(fresh.assignee?.id);
      setDueDate(fresh.dueDate || '');
      setError(null);
      setIsConflict(false);
    } catch {
      setError('Failed to refresh latest issue state.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConflict(false);

    if (!title.trim()) {
      setError('Title cannot be blank.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateIssue(currentIssue.id, {
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        priority,
        assigneeId: assigneeId !== undefined ? (assigneeId === 0 ? 0 : assigneeId) : undefined,
        dueDate: dueDate || undefined,
        version: currentIssue.version, // Required for optimistic concurrency check
      });

      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        if (err.status === 409) {
          setIsConflict(true);
          setError(err.message || 'Conflict: This issue was modified by another user.');
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update issue.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-badge-row">
              <span className="badge badge-primary font-mono">{currentIssue.key}</span>
              <span className="badge badge-subtle">Version {currentIssue.version}</span>
            </div>
            <h2 className="modal-title">Issue Details</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'details'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-foreground'
            }`}
            onClick={() => setActiveTab('details')}
          >
            <FileText size={16} />
            <span>Details</span>
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'comments'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-foreground'
            }`}
            onClick={() => setActiveTab('comments')}
          >
            <MessageSquare size={16} />
            <span>Comments</span>
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'activity'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-foreground'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            <History size={16} />
            <span>Activity History</span>
          </button>
        </div>

        {error && (
          <div className={`alert ${isConflict ? 'alert-warning' : 'alert-error'} mb-4`} role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{error}</span>
              {isConflict && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline mt-2"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? 'Reloading...' : 'Reload Latest State'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 1: Edit Form */}
        {activeTab === 'details' && (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="editIssueTitle">Title *</label>
              <input
                id="editIssueTitle"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label htmlFor="editIssueType">Type</label>
                <select
                  id="editIssueType"
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as IssueType)}
                >
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="FEATURE">Feature</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editIssuePriority">Priority</label>
                <select
                  id="editIssuePriority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editIssueStatus">Status</label>
                <select
                  id="editIssueStatus"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IssueStatus)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="editIssueAssignee">Assignee</label>
                <select
                  id="editIssueAssignee"
                  className="form-select"
                  value={assigneeId !== undefined ? assigneeId : ''}
                  onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : 0)}
                >
                  <option value="0">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editIssueDueDate">Due Date</label>
                <input
                  id="editIssueDueDate"
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="editIssueDesc">Description</label>
              <textarea
                id="editIssueDesc"
                className="form-input form-textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isConflict}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Comments */}
        {activeTab === 'comments' && (
          <CommentsSection issueId={currentIssue.id} isProjectOwner={isProjectOwner} />
        )}

        {/* Tab 3: Activity Timeline */}
        {activeTab === 'activity' && <ActivityTimeline issueId={currentIssue.id} />}
      </div>
    </div>
  );
};
