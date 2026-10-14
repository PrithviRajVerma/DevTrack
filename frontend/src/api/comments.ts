import { apiClient } from './client';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from '../types/comment';

export const commentsApi = {
  getComments: async (issueId: number): Promise<Comment[]> => {
    return apiClient<Comment[]>(`/issues/${issueId}/comments`, { method: 'GET' });
  },

  addComment: async (issueId: number, data: CreateCommentRequest): Promise<Comment> => {
    return apiClient<Comment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateComment: async (commentId: number, data: UpdateCommentRequest): Promise<Comment> => {
    return apiClient<Comment>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteComment: async (commentId: number): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
