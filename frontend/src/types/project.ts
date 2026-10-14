import { User } from './auth';

export type ProjectRole = 'OWNER' | 'MEMBER';

export interface Project {
  id: number;
  name: string;
  projectKey: string;
  description?: string;
  owner: User;
  currentUserRole?: ProjectRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  projectKey: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface ProjectMember {
  id: number;
  user: User;
  role: ProjectRole;
  joinedAt: string;
}

export interface AddProjectMemberRequest {
  email: string;
  role: ProjectRole;
}
