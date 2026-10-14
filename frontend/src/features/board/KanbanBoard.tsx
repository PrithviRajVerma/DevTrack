import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { Issue, IssueStatus } from '../../types/issue';
import { updateIssue } from '../../api/issues';
import { ApiException } from '../../api/client';

interface Props {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onIssueUpdated: (updated: Issue) => void;
  onRefreshNeeded: () => void;
}

const COLUMNS: { status: IssueStatus; label: string; headerColor: string }[] = [
  { status: 'TODO', label: 'To Do', headerColor: 'border-t-4 border-slate-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', headerColor: 'border-t-4 border-blue-500' },
  { status: 'IN_REVIEW', label: 'In Review', headerColor: 'border-t-4 border-amber-500' },
  { status: 'DONE', label: 'Done', headerColor: 'border-t-4 border-emerald-500' },
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

  const isOverdue = (dueDate?: string, status?: IssueStatus) => {
    if (!dueDate || status === 'DONE') return false;
    return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div className="kanban-wrapper">
      {boardError && (
        <div className="alert alert-warning mb-4" role="alert">
          <AlertCircle size={16} />
          <span>{boardError}</span>
        </div>
      )}

      <div className="kanban-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colIssues = issues.filter((i) => i.status === col.status);

          return (
            <div
              key={col.status}
              className={`kanban-column flex flex-col bg-card/60 rounded-lg p-3 border border-border shadow-sm min-h-[500px] ${col.headerColor}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="kanban-col-header flex items-center justify-between pb-3 mb-3 border-b border-border">
                <span className="font-semibold text-sm">{col.label}</span>
                <span className="badge badge-subtle text-xs px-2 py-0.5 rounded-full font-mono">
                  {colIssues.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="kanban-col-cards flex-1 space-y-3 overflow-y-auto">
                {colIssues.map((issue) => {
                  const overdue = isOverdue(issue.dueDate, issue.status);
                  const isBeingUpdated = updatingId === issue.id;
                  const nextStatus = getNextStatus(issue.status);
                  const prevStatus = getPrevStatus(issue.status);

                  return (
                    <div
                      key={issue.id}
                      draggable={!isBeingUpdated}
                      onDragStart={(e) => handleDragStart(e, issue.id)}
                      onClick={() => onIssueClick(issue)}
                      className={`kanban-card p-3 rounded-md bg-card border border-border hover:border-primary/50 shadow-sm cursor-pointer transition-all ${
                        isBeingUpdated ? 'opacity-50 pointer-events-none' : ''
                      } ${draggedIssueId === issue.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge badge-primary font-mono text-xs">{issue.key}</span>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`badge text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              issue.priority === 'URGENT'
                                ? 'bg-red-500/20 text-red-500'
                                : issue.priority === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-500'
                                : issue.priority === 'MEDIUM'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}
                          >
                            {issue.priority}
                          </span>
                          <span className="badge badge-subtle text-[10px] px-1.5 py-0.5 rounded">
                            {issue.type}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                        {issue.title}
                      </h4>

                      <div className="flex items-center justify-between text-xs text-secondary pt-2 border-t border-border">
                        <div className="flex items-center space-x-1">
                          <UserIcon size={12} />
                          <span className="truncate max-w-[100px]">
                            {issue.assignee ? issue.assignee.name : 'Unassigned'}
                          </span>
                        </div>

                        {issue.dueDate && (
                          <div
                            className={`flex items-center space-x-1 ${
                              overdue ? 'text-destructive font-semibold' : ''
                            }`}
                          >
                            <Calendar size={12} />
                            <span>{issue.dueDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Move Transition Controls */}
                      <div
                        className="flex items-center justify-between mt-2 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {prevStatus ? (
                          <button
                            type="button"
                            className="btn-icon p-1 text-secondary hover:text-foreground text-xs flex items-center"
                            title={`Move back to ${prevStatus}`}
                            onClick={() => handleStatusChange(issue, prevStatus)}
                          >
                            <ArrowLeft size={12} />
                          </button>
                        ) : (
                          <div />
                        )}

                        {nextStatus && (
                          <button
                            type="button"
                            className="btn-icon p-1 text-secondary hover:text-foreground text-xs flex items-center"
                            title={`Advance to ${nextStatus}`}
                            onClick={() => handleStatusChange(issue, nextStatus)}
                          >
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colIssues.length === 0 && (
                  <div className="py-12 text-center text-xs text-secondary border-2 border-dashed border-border/60 rounded-md">
                    Drop issues here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
