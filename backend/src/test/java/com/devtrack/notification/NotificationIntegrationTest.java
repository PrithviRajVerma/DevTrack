package com.devtrack.notification;

import com.devtrack.activity.repository.ActivityEventRepository;
import com.devtrack.comment.repository.CommentRepository;
import com.devtrack.issue.dto.CreateIssueRequest;
import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.entity.IssueType;
import com.devtrack.issue.repository.IssueRepository;
import com.devtrack.issue.repository.ProjectCounterRepository;
import com.devtrack.notification.entity.Notification;
import com.devtrack.notification.entity.NotificationType;
import com.devtrack.notification.repository.NotificationRepository;
import com.devtrack.outbox.repository.OutboxEventRepository;
import com.devtrack.outbox.worker.OutboxPollingWorker;
import com.devtrack.project.entity.Project;
import com.devtrack.project.entity.ProjectMember;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.project.repository.ProjectMemberRepository;
import com.devtrack.project.repository.ProjectRepository;
import com.devtrack.security.JwtService;
import com.devtrack.user.entity.User;
import com.devtrack.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private ProjectCounterRepository projectCounterRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ActivityEventRepository activityEventRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private OutboxPollingWorker outboxPollingWorker;

    @Autowired
    private JwtService jwtService;

    private User alice;
    private User bob;
    private String aliceToken;
    private String bobToken;
    private Project project;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        outboxEventRepository.deleteAll();
        activityEventRepository.deleteAll();
        commentRepository.deleteAll();
        issueRepository.deleteAll();
        projectCounterRepository.deleteAll();
        projectMemberRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        alice = userRepository.save(new User("Alice Owner", "alice@example.com", "hash123"));
        bob = userRepository.save(new User("Bob Assignee", "bob@example.com", "hash123"));

        aliceToken = jwtService.generateToken(alice);
        bobToken = jwtService.generateToken(bob);

        project = projectRepository.save(new Project("Core System", "CORE", "Core system project", alice));
        projectMemberRepository.save(new ProjectMember(project, alice, ProjectRole.OWNER));
        projectMemberRepository.save(new ProjectMember(project, bob, ProjectRole.MEMBER));
    }

    @Test
    @DisplayName("GET /api/notifications returns user's notifications ordered by createdAt desc")
    void shouldListUserNotifications() throws Exception {
        notificationRepository.save(new Notification(bob, NotificationType.ISSUE_ASSIGNED, "Assigned to CORE-1", null));
        notificationRepository.save(new Notification(bob, NotificationType.STATUS_CHANGED, "Status of CORE-1 changed", null));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].type").value("STATUS_CHANGED"))
                .andExpect(jsonPath("$[1].type").value("ISSUE_ASSIGNED"));
    }

    @Test
    @DisplayName("GET /api/notifications/unread-count returns accurate unread count")
    void shouldReturnAccurateUnreadCount() throws Exception {
        Notification n1 = notificationRepository.save(new Notification(bob, NotificationType.ISSUE_ASSIGNED, "Assigned to CORE-1", null));
        Notification n2 = notificationRepository.save(new Notification(bob, NotificationType.STATUS_CHANGED, "Status changed", null));
        n2.setReadAt(java.time.Instant.now());
        notificationRepository.save(n2);

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));
    }

    @Test
    @DisplayName("PATCH /api/notifications/{id}/read marks single notification as read")
    void shouldMarkNotificationAsRead() throws Exception {
        Notification notification = notificationRepository.save(new Notification(bob, NotificationType.ISSUE_ASSIGNED, "Assigned", null));

        mockMvc.perform(patch("/api/notifications/" + notification.getId() + "/read")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true))
                .andExpect(jsonPath("$.readAt").isNotEmpty());

        Notification updated = notificationRepository.findById(notification.getId()).orElseThrow();
        assertThat(updated.isRead()).isTrue();
    }

    @Test
    @DisplayName("PATCH /api/notifications/{id}/read rejects another user's notification (403)")
    void shouldRejectReadingAnotherUsersNotification() throws Exception {
        Notification notification = notificationRepository.save(new Notification(bob, NotificationType.ISSUE_ASSIGNED, "Assigned to Bob", null));

        mockMvc.perform(patch("/api/notifications/" + notification.getId() + "/read")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /api/notifications/read-all marks all unread notifications for user as read")
    void shouldMarkAllNotificationsAsRead() throws Exception {
        notificationRepository.save(new Notification(bob, NotificationType.ISSUE_ASSIGNED, "Assigned 1", null));
        notificationRepository.save(new Notification(bob, NotificationType.STATUS_CHANGED, "Status 2", null));

        mockMvc.perform(patch("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All notifications marked as read"));

        assertThat(notificationRepository.countByRecipientIdAndReadAtIsNull(bob.getId())).isEqualTo(0);
    }

    @Test
    @DisplayName("Transactional Outbox end-to-end: Issue creation with assignee delivers notification via worker")
    void shouldDeliverNotificationViaTransactionalOutboxWorker() throws Exception {
        CreateIssueRequest request = new CreateIssueRequest(
                "Assigned Issue", "Description", IssueType.TASK, IssueStatus.TODO, IssuePriority.HIGH, bob.getId(), null
        );

        mockMvc.perform(post("/api/projects/" + project.getId() + "/issues")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Verify outbox event was recorded in DB
        assertThat(outboxEventRepository.count()).isEqualTo(1);

        // Run worker synchronously to process outbox events
        outboxPollingWorker.processAllPendingSynchronously();

        // Verify notification delivered to Bob
        assertThat(notificationRepository.countByRecipientIdAndReadAtIsNull(bob.getId())).isEqualTo(1);
        Notification notification = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(bob.getId()).getFirst();
        assertThat(notification.getType()).isEqualTo(NotificationType.ISSUE_ASSIGNED);
        assertThat(notification.getMessage()).contains("You were assigned to CORE-1");
    }
}
