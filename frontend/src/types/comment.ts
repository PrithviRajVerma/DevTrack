import { User } from './auth';

export interface Comment {
  id: number;
  issueId: number;
  author: User;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  body: string;
}

export interface UpdateCommentRequest {
  body: string;
}
