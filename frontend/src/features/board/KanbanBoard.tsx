import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  ChevronUp,
  ChevronsUp,
  Minus,
  ChevronDown,
} from 'lucide-react';
import { Issue, IssueStatus, IssuePriority } from '../../types/issue';
import { updateIssue } from '../../api/issues';
import { ApiException } from '../../api/client';
import { Avatar } from '../../components/common/Avatar';

interface Props {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onIssueUpdated: (updated: Issue) => void;
  onRefreshNeeded: () => void;
}

const COLUMNS: { status: IssueStatus; label: string; dotColor: string }[] = [
  { status: 'TODO', label: 'To Do', dotColor: 'var(--status-todo)' },
  { status: 'IN_PROGRESS', label: 'In Progress', dotColor: 'var(--status-in-progress)' },
  { status: 'IN_REVIEW', label: 'In Review', dotColor: 'var(--status-in-review)' },
  { status: 'DONE', label: 'Done', dotColor: 'var(--status-done)' },
];

export const KanbanBoard: React.FC<Props> = ({
  issues,
  onIssueClick,
  onIssueUpdated,
  onRefreshNeeded,
}) => {
  const [draggedIssueId, setDraggedIssueId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [activeMobileStatus, setActiveMobileStatus] = useState<IssueStatus>('TODO');

  const handleStatusChange = async (issue: Issue, targetStatus: IssueStatus) => {
    if (issue.status === targetStatus) return;

    setUpdatingId(issue.id);
    setBoardError(null);

    try {
      const updated = await updateIssue(issue.id, {
        status: targetStatus,
        version: issue.version,
      });
      onIssueUpdated(updated);
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 409) {
        setBoardError(`Conflict moving ${issue.key}: Modified by another user. Refreshing state...`);
      } else if (err instanceof Error) {
        setBoardError(`Failed to update ${issue.key}: ${err.message}`);
      } else {
        setBoardError(`Failed to update status for ${issue.key}`);
      }
      onRefreshNeeded();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, issueId: number) => {
    e.dataTransfer.setData('text/plain', String(issueId));
    setDraggedIssueId(issueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: IssueStatus) => {
    e.preventDefault();
    const issueIdStr = e.dataTransfer.getData('text/plain');
    const issueId = Number(issueIdStr);
    setDraggedIssueId(null);

    if (!issueId) return;
    const targetIssue = issues.find((i) => i.id === issueId);
    if (targetIssue && targetIssue.status !== targetStatus) {
      handleStatusChange(targetIssue, targetStatus);
    }
  };

  const getNextStatus = (current: IssueStatus): IssueStatus | null => {
    switch (current) {
      case 'TODO':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'IN_REVIEW';
      case 'IN_REVIEW':
        return 'DONE';
      default:
        return null;
    }
  };

  const getPrevStatus = (current: IssueStatus): IssueStatus | null => {
    switch (current) {
      case 'DONE':
        return 'IN_REVIEW';
      case 'IN_REVIEW':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'TODO';
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority: IssuePriority) => {
    switch (priority) {
      case 'URGENT':
        return <ChevronsUp size={14} className="text-rose-500" />;
      case 'HIGH':
        return <ChevronUp size={14} className="text-orange-500" />;
      case 'MEDIUM':
        return <Minus size={14} className="text-sky-500" />;
      case 'LOW':
        return <ChevronDown size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="kanban-board-wrapper">
      {boardError && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{boardError}</span>
        </div>
      )}

      {/* Mobile Horizontal Status Tabs (< 768px) */}
      <div className="mobile-status-tabs" role="tablist">
        {COLUMNS.map((col) => {
          const count = issues.filter((i) => i.status === col.status).length;
          const isActive = activeMobileStatus === col.status;
          return (
            <button
              key={col.status}
              role="tab"
              aria-selected={isActive}
              className={`mobile-status-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveMobileStatus(col.status)}
            >
              <span
                className="kanban-status-dot"
                style={{ backgroundColor: col.dotColor }}
              />
              <span>{col.label}</span>
              <span className="kanban-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const columnIssues = issues.filter((i) => i.status === col.status);
          const isHiddenOnMobile = activeMobileStatus !== col.status;

          return (
            <div
              key={col.status}
              className={`kanban-column ${isHiddenOnMobile ? 'kanban-column-hidden-mobile' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className="kanban-header">
                <div className="kanban-header-left">
                  <span
                    className="kanban-status-dot"
                    style={{ backgroundColor: col.dotColor }}
                  />
                  <h3 className="kanban-title">{col.label}</h3>
                  <span className="kanban-count">{columnIssues.length}</span>
                </div>
              </div>

              <div className="kanban-cards">
                {columnIssues.length === 0 ? (
                  <div className="kanban-empty">
                    <p>No issues in {col.label}</p>
                  </div>
                ) : (
                  columnIssues.map((issue) => {
                    const isUpdating = updatingId === issue.id;
                    const next = getNextStatus(issue.status);
                    const prev = getPrevStatus(issue.status);

                    return (
                      <div
                        key={issue.id}
                        className={`kanban-card ${
                          draggedIssueId === issue.id ? 'dragging' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, issue.id)}
                        onClick={() => onIssueClick(issue)}
                      >
                        <div className="kanban-card-header">
                          <span className="badge-code font-mono">{issue.key}</span>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(issue.priority)}
                            <span className={`badge badge-${issue.priority.toLowerCase()}`}>
                              {issue.priority}
                            </span>
                          </div>
                        </div>

                        <div className="kanban-card-title">{issue.title}</div>

                        <div className="kanban-card-footer">
                          <div className="kanban-card-meta">
                            {issue.dueDate && (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  color: 'var(--color-text-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                <Calendar size={11} style={{ marginRight: 2 }} />
                                {issue.dueDate}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {issue.assignee ? (
                              <Avatar name={issue.assignee.name} email={issue.assignee.email} size="xs" />
                            ) : (
                              <span
                                className="text-xs text-muted"
                                title="Unassigned"
                              >
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>

                        {/* One-Tap Advance / Regress Buttons (Touch-friendly) */}
                        <div
                          className="kanban-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {prev && (
                            <button
                              className="btn btn-outline btn-sm btn-icon"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(issue, prev)}
                              title={`Move back to ${prev.replace('_', ' ')}`}
                            >
                              <ArrowLeft size={13} />
                            </button>
                          )}
                          <div style={{ flex: 1 }} />
                          {next && (
                            <button
                              className="btn btn-outline btn-sm btn-icon"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(issue, next)}
                              title={`Advance to ${next.replace('_', ' ')}`}
                            >
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
