import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Navbar } from '../components/Navbar';
import { dashboardApi } from '../api/dashboard';
import { listProjects } from '../api/projects';
import { DashboardSummary, AssigneeWorkload } from '../types/dashboard';
import { ActivityEvent } from '../types/activity';
import { Project } from '../types/project';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [workload, setWorkload] = useState<AssigneeWorkload[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);
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
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadDashboardData(selectedProjectId);
  }, [loadDashboardData, selectedProjectId]);

  const doneCount = summary?.statusBreakdown?.DONE || 0;
  const totalCount = summary?.totalIssues || 0;
  const completionPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="layout-root">
      <Navbar />

      <main className="main-content">
        <div className="container space-y-6">
          {/* Header & Project Filter */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user?.name || 'Developer'}!
              </h1>
              <p className="text-sm text-secondary">
                Live workspace metrics, team workload, and real-time collaboration activity.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-secondary" />
              <select
                className="form-select form-select-sm"
                value={selectedProjectId || ''}
                onChange={(e) =>
                  setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">All Accessible Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectKey})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="center-screen py-16">
              <div className="spinner"></div>
              <p className="loading-text">Aggregating live project metrics...</p>
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center space-x-4 border border-border shadow-sm">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                    <FolderKanban size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                      Total Issues
                    </span>
                    <h3 className="text-2xl font-bold text-foreground">{summary?.totalIssues || 0}</h3>
                  </div>
                </div>

                <div className="card p-4 flex items-center space-x-4 border border-border shadow-sm">
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                      Assigned To Me
                    </span>
                    <h3 className="text-2xl font-bold text-foreground">
                      {summary?.openIssuesAssignedToMe || 0}
                    </h3>
                  </div>
                </div>

                <div className="card p-4 flex items-center space-x-4 border border-border shadow-sm">
                  <div
                    className={`p-3 rounded-lg ${
                      (summary?.overdueIssues || 0) > 0
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                      Overdue Issues
                    </span>
                    <h3
                      className={`text-2xl font-bold ${
                        (summary?.overdueIssues || 0) > 0 ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      {summary?.overdueIssues || 0}
                    </h3>
                  </div>
                </div>

                <div className="card p-4 flex items-center space-x-4 border border-border shadow-sm">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                      Done Rate
                    </span>
                    <h3 className="text-2xl font-bold text-foreground">{completionPercentage}%</h3>
                  </div>
                </div>
              </div>

              {/* Status Breakdown & Priority Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Breakdown Card */}
                <div className="card p-5 border border-border shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center space-x-2">
                    <TrendingUp size={18} className="text-primary" />
                    <span>Status Breakdown</span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">To Do</span>
                        <span className="font-semibold">{summary?.statusBreakdown?.TODO || 0}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-slate-400 h-2 rounded-full"
                          style={{
                            width: `${
                              totalCount > 0 ? ((summary?.statusBreakdown?.TODO || 0) / totalCount) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">In Progress</span>
                        <span className="font-semibold">{summary?.statusBreakdown?.IN_PROGRESS || 0}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              totalCount > 0
                                ? ((summary?.statusBreakdown?.IN_PROGRESS || 0) / totalCount) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">In Review</span>
                        <span className="font-semibold">{summary?.statusBreakdown?.IN_REVIEW || 0}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{
                            width: `${
                              totalCount > 0
                                ? ((summary?.statusBreakdown?.IN_REVIEW || 0) / totalCount) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">Done</span>
                        <span className="font-semibold">{summary?.statusBreakdown?.DONE || 0}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${
                              totalCount > 0 ? ((summary?.statusBreakdown?.DONE || 0) / totalCount) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Breakdown Card */}
                <div className="card p-5 border border-border shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center space-x-2">
                    <AlertTriangle size={18} className="text-primary" />
                    <span>Priority Distribution</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <span className="text-xs text-red-500 font-semibold uppercase">Urgent</span>
                      <p className="text-xl font-bold text-red-500">
                        {summary?.priorityBreakdown?.URGENT || 0}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <span className="text-xs text-amber-500 font-semibold uppercase">High</span>
                      <p className="text-xl font-bold text-amber-500">
                        {summary?.priorityBreakdown?.HIGH || 0}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <span className="text-xs text-blue-500 font-semibold uppercase">Medium</span>
                      <p className="text-xl font-bold text-blue-500">
                        {summary?.priorityBreakdown?.MEDIUM || 0}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-500/10 rounded-lg border border-slate-500/20">
                      <span className="text-xs text-secondary font-semibold uppercase">Low</span>
                      <p className="text-xl font-bold text-secondary">
                        {summary?.priorityBreakdown?.LOW || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workload & Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Workload */}
                <div className="card p-5 border border-border shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center space-x-2">
                    <UserCheck size={18} className="text-primary" />
                    <span>Team Workload</span>
                  </h3>

                  {workload.length === 0 ? (
                    <div className="py-8 text-center text-secondary text-sm">
                      No assigned issues recorded.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workload.map((w) => (
                        <div
                          key={w.userId}
                          className="p-3 rounded-lg bg-card/80 border border-border flex items-center justify-between"
                        >
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{w.name}</h4>
                            <span className="text-xs text-secondary">{w.email}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="badge badge-subtle">{w.openCount} Open</span>
                            <span className="badge badge-success">{w.doneCount} Done</span>
                            <span className="font-mono font-bold text-foreground">
                              {w.totalAssigned} Total
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity Feed */}
                <div className="card p-5 border border-border shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center space-x-2">
                    <Activity size={18} className="text-primary" />
                    <span>Recent Activity</span>
                  </h3>

                  {recentActivity.length === 0 ? (
                    <div className="py-8 text-center text-secondary text-sm">
                      No recent activity recorded.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded bg-card/80 border border-border flex flex-col space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{act.actor.name}</span>
                            <span className="text-secondary">
                              {new Date(act.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="badge badge-primary font-mono text-[10px]">
                              {act.issueKey}
                            </span>
                            <span className="text-foreground truncate">{act.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Navigation to Projects */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Explore Projects & Issues</h4>
                  <p className="text-xs text-secondary">
                    View full project boards, issue queues, and team permissions.
                  </p>
                </div>
                <Link to="/projects" className="btn btn-sm btn-primary">
                  View Projects <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
