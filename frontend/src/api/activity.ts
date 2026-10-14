import { apiClient } from './client';
import { ActivityEvent } from '../types/activity';

export const activityApi = {
  getIssueActivity: async (issueId: number): Promise<ActivityEvent[]> => {
    return apiClient<ActivityEvent[]>(`/issues/${issueId}/activity`, { method: 'GET' });
  },
};
