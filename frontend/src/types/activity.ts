import { User } from './auth';

export type ActivityEventType =
  | 'ISSUE_CREATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'TYPE_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'DUE_DATE_CHANGED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED';

export interface ActivityEvent {
  id: number;
  issueId: number;
  issueKey: string;
  issueTitle: string;
  actor: User;
  eventType: ActivityEventType;
  details: string;
  createdAt: string;
}
