package com.devtrack.outbox.dto;

import com.devtrack.notification.entity.NotificationType;

public record OutboxPayload(
        Long recipientId,
        Long issueId,
        Long actorId,
        NotificationType notificationType,
        String message
) {}
