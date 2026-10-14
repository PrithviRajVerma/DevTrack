import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  PlusCircle,
  ArrowRightCircle,
  AlertTriangle,
  UserCheck,
  Calendar,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { activityApi } from '../../api/activity';
import { ActivityEvent, ActivityEventType } from '../../types/activity';
import { Avatar } from '../../components/common/Avatar';

interface Props {
  issueId: number;
}

const getEventIcon = (type: ActivityEventType) => {
  switch (type) {
    case 'ISSUE_CREATED':
      return <PlusCircle size={16} className="text-primary" />;
    case 'STATUS_CHANGED':
      return <ArrowRightCircle size={16} className="text-info" />;
    case 'PRIORITY_CHANGED':
      return <AlertTriangle size={16} className="text-warning" />;
    case 'ASSIGNEE_CHANGED':
      return <UserCheck size={16} className="text-success" />;
    case 'DUE_DATE_CHANGED':
      return <Calendar size={16} className="text-purple-500" />;
    case 'COMMENT_ADDED':
      return <MessageSquare size={16} className="text-blue-500" />;
    case 'COMMENT_DELETED':
      return <Trash2 size={16} className="text-destructive" />;
    default:
      return <Clock size={16} className="text-secondary" />;
  }
};

export const ActivityTimeline: React.FC<Props> = ({ issueId }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await activityApi.getIssueActivity(issueId);
      setEvents(data);
    } catch {
      setError('Failed to load activity history.');
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  if (isLoading) {
    return <div className="py-8 text-center text-secondary">Loading activity timeline...</div>;
  }

  if (error) {
    return <div className="alert alert-error text-sm">{error}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-secondary">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="activity-timeline-container relative pl-6 border-l-2 border-border space-y-4">
      {events.map((event) => (
        <div key={event.id} className="activity-item relative">
          {/* Dot / Icon indicator */}
          <div className="absolute -left-[33px] top-0 p-1 bg-background rounded-full border border-border shadow-sm">
            {getEventIcon(event.eventType)}
          </div>

          <div className="activity-content">
            <div className="flex items-center space-x-2 text-xs text-secondary mb-1">
              <Avatar name={event.actor.name} email={event.actor.email} size="xs" />
              <span className="font-semibold text-foreground">{event.actor.name}</span>
              <span>•</span>
              <span>
                {new Date(event.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-foreground bg-muted p-2 rounded border border-border">
              {event.details}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
