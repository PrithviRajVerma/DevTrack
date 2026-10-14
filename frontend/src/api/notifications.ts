import { apiClient } from './client';
import { Notification } from '../types/notification';

export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    return apiClient<Notification[]>('/notifications', { method: 'GET' });
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    return apiClient<{ unreadCount: number }>('/notifications/unread-count', { method: 'GET' });
  },

  markAsRead: async (notificationId: number): Promise<Notification> => {
    return apiClient<Notification>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/notifications/read-all', { method: 'PATCH' });
  },
};
