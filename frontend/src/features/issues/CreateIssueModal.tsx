import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createIssue } from '../../api/issues';
import { ApiException } from '../../api/client';
import { Issue, IssuePriority, IssueStatus, IssueType } from '../../types/issue';
import { ProjectMember } from '../../types/project';

interface Props {
  isOpen: boolean;
  projectId: number;
  members: ProjectMember[];
  onClose: () => void;
  onSuccess: (issue: Issue) => void;
}

export const CreateIssueModal: React.FC<Props> = ({
  isOpen,
  projectId,
  members,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('TASK');
  const [status, setStatus] = useState<IssueStatus>('TODO');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Issue title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createIssue(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      });

      setTitle('');
      setDescription('');
      setType('TASK');
      setStatus('TODO');
      setPriority('MEDIUM');
      setAssigneeId(undefined);
      setDueDate('');

      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create issue.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">Create New Issue</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="issueTitle">Title *</label>
            <input
              id="issueTitle"
              type="text"
              className="form-input"
              placeholder="e.g. Implement user password reset flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label htmlFor="issueType">Type</label>
              <select
                id="issueType"
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
              <label htmlFor="issuePriority">Priority</label>
              <select
                id="issuePriority"
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
              <label htmlFor="issueStatus">Status</label>
              <select
                id="issueStatus"
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
              <label htmlFor="issueAssignee">Assignee</label>
              <select
                id="issueAssignee"
                className="form-select"
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="issueDueDate">Due Date</label>
              <input
                id="issueDueDate"
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="issueDesc">Description</label>
            <textarea
              id="issueDesc"
              className="form-input form-textarea"
              rows={4}
              placeholder="Provide background, requirements, or steps to reproduce..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
