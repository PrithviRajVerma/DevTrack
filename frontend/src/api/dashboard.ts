import { apiClient } from './client';
import { AssigneeWorkload, DashboardSummary } from '../types/dashboard';
import { ActivityEvent } from '../types/activity';

export const dashboardApi = {
  getSummary: async (projectId?: number): Promise<DashboardSummary> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get<DashboardSummary>('/api/dashboard/summary', { params });
    return response.data;
  },

  getWorkload: async (projectId?: number): Promise<AssigneeWorkload[]> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get<AssigneeWorkload[]>('/api/dashboard/workload', { params });
    return response.data;
  },

  getRecentActivity: async (limit: number = 15): Promise<ActivityEvent[]> => {
    const response = await apiClient.get<ActivityEvent[]>('/api/dashboard/recent-activity', {
      params: { limit },
    });
    return response.data;
  },
};
