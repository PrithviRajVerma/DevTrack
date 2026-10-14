import { apiClient } from './client';
import { ActivityEvent } from '../types/activity';

export const activityApi = {
  getIssueActivity: async (issueId: number): Promise<ActivityEvent[]> => {
    const response = await apiClient.get<ActivityEvent[]>(`/api/issues/${issueId}/activity`);
    return response.data;
  },
};
