import { apiClient } from './client';
import {
  CreateIssueRequest,
  Issue,
  IssueFilterParams,
  PageResponse,
  UpdateIssueRequest,
} from '../types/issue';

export async function listProjectIssues(
  projectId: number,
  params: IssueFilterParams = {}
): Promise<PageResponse<Issue>> {
  const query = new URLSearchParams();

  if (params.status) query.append('status', params.status);
  if (params.priority) query.append('priority', params.priority);
  if (params.type) query.append('type', params.type);
  if (params.assigneeId !== undefined) query.append('assigneeId', String(params.assigneeId));
  if (params.overdue !== undefined) query.append('overdue', String(params.overdue));
  if (params.search) query.append('search', params.search);
  if (params.page !== undefined) query.append('page', String(params.page));
  if (params.size !== undefined) query.append('size', String(params.size));
  if (params.sort) query.append('sort', params.sort);

  const queryString = query.toString();
  const endpoint = `/projects/${projectId}/issues${queryString ? `?${queryString}` : ''}`;

  return apiClient<PageResponse<Issue>>(endpoint, { method: 'GET' });
}

export async function getIssue(issueId: number): Promise<Issue> {
  return apiClient<Issue>(`/issues/${issueId}`, { method: 'GET' });
}

export async function createIssue(
  projectId: number,
  data: CreateIssueRequest
): Promise<Issue> {
  return apiClient<Issue>(`/projects/${projectId}/issues`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIssue(
  issueId: number,
  data: UpdateIssueRequest
): Promise<Issue> {
  return apiClient<Issue>(`/issues/${issueId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteIssue(issueId: number): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/issues/${issueId}`, {
    method: 'DELETE',
  });
}
