import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Navbar } from '../components/Navbar';
import { dashboardApi } from '../api/dashboard';
import { listProjects } from '../api/projects';
import { DashboardSummary, AssigneeWorkload } from '../types/dashboard';
import { ActivityEvent } from '../types/activity';
import { Project } from '../types/project';
import { Avatar } from '../components/common/Avatar';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [workload, setWorkload] = useState<AssigneeWorkload[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await listProjects();
      setProjects(data);
    } catch {
      // non-blocking
    }
  }, []);

  const loadDashboardData = useCallback(async (projectId?: number) => {
    setError(null);
    try {
      const [sum, work, act] = await Promise.all([
        dashboardApi.getSummary(projectId),
        dashboardApi.getWorkload(projectId),
        dashboardApi.getRecentActivity(12),
      ]);
      setSummary(sum);
      setWorkload(work);
      setRecentActivity(act);
    } catch {
      setError('Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    setIsLoading(true);
    loadDashboardData(selectedProjectId);
  }, [loadDashboardData, selectedProjectId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData(selectedProjectId);
  };

  const doneCount = summary?.statusBreakdown?.DONE || 0;
  const inProgressCount = summary?.statusBreakdown?.IN_PROGRESS || 0;
  const inReviewCount = summary?.statusBreakdown?.IN_REVIEW || 0;
  const todoCount = summary?.statusBreakdown?.TODO || 0;
  const totalCount = summary?.totalIssues || 0;
  const completionPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="layout-root">
      <Navbar />

      <main className="main-content">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header & Workspace Filter */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
            className="sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                  Welcome back, {user?.name || 'Developer'}
                </h1>
                <Sparkles size={16} style={{ color: 'var(--color-primary-base)' }} />
              </div>
              <p className="text-xs text-secondary">
                Real-time metrics, active sprint throughput, and collaboration activity.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Filter size={14} className="text-secondary" />
                <select
                  className="form-select form-select-sm"
                  style={{ minWidth: 180, fontSize: '0.8rem' }}
                  value={selectedProjectId || ''}
                  onChange={(e) =>
                    setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">All Accessible Workspaces</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.projectKey})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm btn-icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh Metrics"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-state" style={{ padding: '4rem 0' }}>
              <div className="spinner"></div>
              <p className="loading-text">Aggregating workspace analytics...</p>
            </div>
          ) : (
            <>
              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Issues */}
                <div
                  className="card"
                  style={{
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FolderKanban size={22} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Total Issues
                    </span>
                    <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1.2 }}>
                      {summary?.totalIssues || 0}
                    </h3>
                  </div>
                </div>

                {/* Assigned To Me */}
                <div
                  className="card"
                  style={{
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(168, 85, 247, 0.12)',
                      color: '#c084fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Assigned To Me
                    </span>
                    <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1.2 }}>
                      {summary?.openIssuesAssignedToMe || 0}
                    </h3>
                  </div>
                </div>

                {/* Overdue Issues */}
                <div
                  className="card"
                  style={{
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    borderColor: (summary?.overdueIssues || 0) > 0 ? 'rgba(244, 63, 94, 0.35)' : undefined,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: (summary?.overdueIssues || 0) > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                      color: (summary?.overdueIssues || 0) > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Overdue Issues
                    </span>
                    <h3
                      style={{
                        fontSize: '1.65rem',
                        fontWeight: 700,
                        color: (summary?.overdueIssues || 0) > 0 ? 'var(--color-danger)' : 'var(--color-text-main)',
                        lineHeight: 1.2,
                      }}
                    >
                      {summary?.overdueIssues || 0}
                    </h3>
                  </div>
                </div>

                {/* Completion Rate */}
                <div
                  className="card"
                  style={{
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Done Rate
                    </span>
                    <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1.2 }}>
                      {completionPercentage}%
                    </h3>
                  </div>
                </div>
              </div>

              {/* Status Breakdown & Priority Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Breakdown Card */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={16} style={{ color: 'var(--color-primary-base)' }} />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        Status Distribution
                      </h3>
                    </div>
                    <span className="text-xs text-secondary font-mono">{totalCount} total</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {/* To Do */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 500 }}>To Do</span>
                        <span className="font-mono text-secondary">{todoCount}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-surface-2)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${totalCount > 0 ? (todoCount / totalCount) * 100 : 0}%`,
                            height: '100%',
                            background: '#38bdf8',
                            borderRadius: 9999,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* In Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 500 }}>In Progress</span>
                        <span className="font-mono text-secondary">{inProgressCount}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-surface-2)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%`,
                            height: '100%',
                            background: '#f59e0b',
                            borderRadius: 9999,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* In Review */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#a855f7', fontWeight: 500 }}>In Review</span>
                        <span className="font-mono text-secondary">{inReviewCount}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-surface-2)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${totalCount > 0 ? (inReviewCount / totalCount) * 100 : 0}%`,
                            height: '100%',
                            background: '#a855f7',
                            borderRadius: 9999,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Done */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#10b981', fontWeight: 500 }}>Done</span>
                        <span className="font-mono text-secondary">{doneCount}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-surface-2)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                            height: '100%',
                            background: '#10b981',
                            borderRadius: 9999,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Breakdown Card */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={16} style={{ color: 'var(--color-primary-base)' }} />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        Priority Breakdown
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(244, 63, 94, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 600, textTransform: 'uppercase' }}>
                        Urgent
                      </span>
                      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fb7185', marginTop: '0.2rem' }}>
                        {summary?.priorityBreakdown?.URGENT || 0}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(245, 158, 11, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase' }}>
                        High
                      </span>
                      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }}>
                        {summary?.priorityBreakdown?.HIGH || 0}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(56, 189, 248, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                        Medium
                      </span>
                      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                        {summary?.priorityBreakdown?.MEDIUM || 0}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(148, 163, 184, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Low
                      </span>
                      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                        {summary?.priorityBreakdown?.LOW || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workload & Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Workload */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <UserCheck size={16} style={{ color: 'var(--color-primary-base)' }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      Team Workload
                    </h3>
                  </div>

                  {workload.length === 0 ? (
                    <div style={{ padding: '2.5rem 0', textAlign: 'center' }} className="text-secondary text-sm">
                      No assigned issues in the selected scope.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {workload.map((w) => (
                        <div
                          key={w.userId}
                          style={{
                            padding: '0.75rem 0.9rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-surface-2)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Avatar name={w.name} email={w.email} size="sm" />
                            <div>
                              <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                {w.name}
                              </h4>
                              <span style={{ fontSize: '0.72rem' }} className="text-secondary">{w.email}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <span className="badge badge-subtle">{w.openCount} Open</span>
                            <span className="badge badge-done">{w.doneCount} Done</span>
                            <span className="badge-code font-mono" style={{ fontSize: '0.72rem' }}>
                              {w.totalAssigned} Total
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity Feed */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Activity size={16} style={{ color: 'var(--color-primary-base)' }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      Recent Workspace Activity
                    </h3>
                  </div>

                  {recentActivity.length === 0 ? (
                    <div style={{ padding: '2.5rem 0', textAlign: 'center' }} className="text-secondary text-sm">
                      No recent activity recorded.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 340, overflowY: 'auto' }}>
                      {recentActivity.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            padding: '0.65rem 0.8rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-surface-2)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Avatar name={act.actor.name} email={act.actor.email} size="xs" />
                              <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{act.actor.name}</span>
                            </div>
                            <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={11} />
                              {new Date(act.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge-code font-mono" style={{ fontSize: '0.72rem' }}>
                              {act.issueKey}
                            </span>
                            <span className="truncate" style={{ color: 'var(--color-text-secondary)', flex: 1 }}>
                              {act.details}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Navigation to Workspaces */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(129, 140, 248, 0.03) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    Ready to work on sprint issues?
                  </h4>
                  <p className="text-xs text-secondary">
                    Jump into Kanban boards, manage sprints, and assign team tasks.
                  </p>
                </div>
                <Link to="/projects" className="btn btn-sm btn-primary">
                  Explore Workspaces <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
