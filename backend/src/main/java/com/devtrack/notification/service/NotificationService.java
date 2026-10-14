package com.devtrack.notification.service;

import com.devtrack.common.exception.ResourceNotFoundException;
import com.devtrack.issue.entity.Issue;
import com.devtrack.notification.dto.NotificationResponse;
import com.devtrack.notification.entity.Notification;
import com.devtrack.notification.entity.NotificationType;
import com.devtrack.notification.repository.NotificationRepository;
import com.devtrack.security.SecurityUtils;
import com.devtrack.user.entity.User;
import com.devtrack.user.service.UserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    public NotificationService(NotificationRepository notificationRepository, UserService userService) {
        this.notificationRepository = notificationRepository;
        this.userService = userService;
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new AccessDeniedException("User is not authenticated"));
        return userService.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countByRecipientIdAndReadAtIsNull(currentUser.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this notification");
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationRepository.markAllAsReadForUser(currentUser.getId(), Instant.now());
    }

    @Transactional
    public Notification createNotification(User recipient, NotificationType type, String message, Issue issue) {
        Notification notification = new Notification(recipient, type, message, issue);
        return notificationRepository.save(notification);
    }
}
