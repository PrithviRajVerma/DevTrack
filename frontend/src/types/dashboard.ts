import { IssuePriority, IssueStatus } from './issue';

export interface DashboardSummary {
  totalIssues: number;
  openIssuesAssignedToMe: number;
  overdueIssues: number;
  statusBreakdown: Record<IssueStatus, number>;
  priorityBreakdown: Record<IssuePriority, number>;
}

export interface AssigneeWorkload {
  userId: number;
  name: string;
  email: string;
  totalAssigned: number;
  openCount: number;
  doneCount: number;
}
