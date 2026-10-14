package com.devtrack.notification.dto;

import com.devtrack.notification.entity.Notification;
import com.devtrack.notification.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        Long recipientId,
        NotificationType type,
        String message,
        Long issueId,
        String issueKey,
        Instant createdAt,
        Instant readAt,
        boolean isRead
) {
    public static NotificationResponse fromEntity(Notification n) {
        if (n == null) {
            return null;
        }
        return new NotificationResponse(
                n.getId(),
                n.getRecipient().getId(),
                n.getType(),
                n.getMessage(),
                n.getIssue() != null ? n.getIssue().getId() : null,
                n.getIssue() != null ? n.getIssue().getKey() : null,
                n.getCreatedAt(),
                n.getReadAt(),
                n.isRead()
        );
    }
}
