import { apiClient } from './client';
import { AssigneeWorkload, DashboardSummary } from '../types/dashboard';
import { ActivityEvent } from '../types/activity';

export const dashboardApi = {
  getSummary: async (projectId?: number): Promise<DashboardSummary> => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return apiClient<DashboardSummary>(`/dashboard/summary${query}`, { method: 'GET' });
  },

  getWorkload: async (projectId?: number): Promise<AssigneeWorkload[]> => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return apiClient<AssigneeWorkload[]>(`/dashboard/workload${query}`, { method: 'GET' });
  },

  getRecentActivity: async (limit: number = 15): Promise<ActivityEvent[]> => {
    return apiClient<ActivityEvent[]>(`/dashboard/recent-activity?limit=${limit}`, { method: 'GET' });
  },
};
