export type NotificationType =
  | 'ISSUE_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'DUE_DATE_REMINDER';

export interface Notification {
  id: number;
  recipientId: number;
  type: NotificationType;
  message: string;
  issueId?: number;
  issueKey?: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
}
