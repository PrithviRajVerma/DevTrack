import { apiClient } from './client';
import {
  AddProjectMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectMember,
  UpdateProjectRequest,
} from '../types/project';

export async function listProjects(): Promise<Project[]> {
  return apiClient<Project[]>('/projects', { method: 'GET' });
}

export async function getProject(projectId: number): Promise<Project> {
  return apiClient<Project>(`/projects/${projectId}`, { method: 'GET' });
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  return apiClient<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  projectId: number,
  data: UpdateProjectRequest
): Promise<Project> {
  return apiClient<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function listProjectMembers(projectId: number): Promise<ProjectMember[]> {
  return apiClient<ProjectMember[]>(`/projects/${projectId}/members`, {
    method: 'GET',
  });
}

export async function addProjectMember(
  projectId: number,
  data: AddProjectMemberRequest
): Promise<ProjectMember> {
  return apiClient<ProjectMember>(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeProjectMember(
  projectId: number,
  userId: number
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  });
}
