import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, ArrowRightCircle, UserCheck, Calendar } from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { Notification, NotificationType } from '../../types/notification';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'ISSUE_ASSIGNED':
      return <UserCheck size={14} className="text-primary" />;
    case 'STATUS_CHANGED':
      return <ArrowRightCircle size={14} className="text-info" />;
    case 'COMMENT_ADDED':
      return <MessageSquare size={14} className="text-blue-500" />;
    case 'DUE_DATE_REMINDER':
      return <Calendar size={14} className="text-warning" />;
    default:
      return <Bell size={14} className="text-secondary" />;
  }
};

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread count every 30 seconds
    const timer = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? updated : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn-icon relative p-2 text-secondary hover:text-foreground transition-colors"
        aria-label="Notifications"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-lg bg-card border border-border shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge badge-primary text-[10px] px-1.5 py-0.2 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline flex items-center space-x-1"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-secondary">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-secondary">
                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors flex items-start space-x-3 ${
                    !n.isRead ? 'bg-primary/5 font-medium' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-full bg-background border border-border shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-snug">{n.message}</p>
                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-secondary">
                      {n.issueKey && (
                        <span className="badge badge-subtle font-mono text-[10px] px-1">
                          {n.issueKey}
                        </span>
                      )}
                      <span>
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      className="p-1 text-secondary hover:text-primary rounded"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
