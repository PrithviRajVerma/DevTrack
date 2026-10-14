import { User } from './auth';

export type IssueType = 'TASK' | 'BUG' | 'FEATURE';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Issue {
  id: number;
  projectId: number;
  projectKey: string;
  issueNumber: number;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  reporter: User;
  assignee?: User;
  dueDate?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: number;
  dueDate?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: number;
  dueDate?: string;
  version: number;
}

export interface IssueFilterParams {
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: number;
  overdue?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
