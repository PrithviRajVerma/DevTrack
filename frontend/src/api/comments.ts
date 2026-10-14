import { apiClient } from './client';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from '../types/comment';

export const commentsApi = {
  getComments: async (issueId: number): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/api/issues/${issueId}/comments`);
    return response.data;
  },

  addComment: async (issueId: number, data: CreateCommentRequest): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/api/issues/${issueId}/comments`, data);
    return response.data;
  },

  updateComment: async (commentId: number, data: UpdateCommentRequest): Promise<Comment> => {
    const response = await apiClient.patch<Comment>(`/api/comments/${commentId}`, data);
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/api/comments/${commentId}`);
  },
};
