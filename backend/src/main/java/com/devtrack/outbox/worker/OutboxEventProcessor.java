package com.devtrack.outbox.worker;

import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.repository.IssueRepository;
import com.devtrack.notification.entity.Notification;
import com.devtrack.notification.repository.NotificationRepository;
import com.devtrack.outbox.dto.OutboxPayload;
import com.devtrack.outbox.entity.OutboxEvent;
import com.devtrack.outbox.entity.OutboxStatus;
import com.devtrack.outbox.repository.OutboxEventRepository;
import com.devtrack.user.entity.User;
import com.devtrack.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class OutboxEventProcessor {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventProcessor.class);
    private static final int MAX_RETRIES = 3;

    private final OutboxEventRepository outboxEventRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final ObjectMapper objectMapper;

    public OutboxEventProcessor(
            OutboxEventRepository outboxEventRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            IssueRepository issueRepository,
            ObjectMapper objectMapper
    ) {
        this.outboxEventRepository = outboxEventRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processEvent(Long eventId) {
        OutboxEvent event = outboxEventRepository.findById(eventId).orElse(null);
        if (event == null || event.getStatus() != OutboxStatus.PENDING) {
            return;
        }

        try {
            OutboxPayload payload = objectMapper.readValue(event.getPayload(), OutboxPayload.class);

            User recipient = userRepository.findById(payload.recipientId()).orElse(null);
            if (recipient == null) {
                log.warn("Recipient not found for outbox event {}", eventId);
                event.setStatus(OutboxStatus.FAILED);
                event.setErrorMessage("Recipient user with id " + payload.recipientId() + " not found");
                event.setProcessedAt(Instant.now());
                outboxEventRepository.save(event);
                return;
            }

            Issue issue = null;
            if (payload.issueId() != null) {
                issue = issueRepository.findById(payload.issueId()).orElse(null);
            }

            // Deliver in-app notification idempotently
            Notification notification = new Notification(
                    recipient,
                    payload.notificationType(),
                    payload.message(),
                    issue
            );
            notificationRepository.save(notification);

            // Mark event processed
            event.setStatus(OutboxStatus.PROCESSED);
            event.setProcessedAt(Instant.now());
            event.setErrorMessage(null);
            outboxEventRepository.save(event);

            log.debug("Outbox event {} successfully processed and notification delivered to user {}",
                    eventId, recipient.getId());

        } catch (Exception e) {
            log.error("Error processing outbox event {}: {}", eventId, e.getMessage(), e);
            event.incrementRetryCount();
            if (event.getRetryCount() >= MAX_RETRIES) {
                event.setStatus(OutboxStatus.FAILED);
                event.setErrorMessage("Exceeded max retries: " + e.getMessage());
            } else {
                event.setErrorMessage("Retry " + event.getRetryCount() + ": " + e.getMessage());
            }
            event.setProcessedAt(Instant.now());
            outboxEventRepository.save(event);
        }
    }
}
