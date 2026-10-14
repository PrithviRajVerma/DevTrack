package com.devtrack.concurrency;

import com.devtrack.activity.repository.ActivityEventRepository;
import com.devtrack.comment.repository.CommentRepository;
import com.devtrack.common.exception.ConflictException;
import com.devtrack.config.ExecutorMetrics;
import com.devtrack.issue.dto.CreateIssueRequest;
import com.devtrack.issue.dto.IssueResponse;
import com.devtrack.issue.dto.UpdateIssueRequest;
import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.entity.IssueType;
import com.devtrack.issue.repository.IssueRepository;
import com.devtrack.issue.repository.ProjectCounterRepository;
import com.devtrack.issue.service.IssueService;
import com.devtrack.notification.entity.NotificationType;
import com.devtrack.notification.repository.NotificationRepository;
import com.devtrack.outbox.dto.OutboxPayload;
import com.devtrack.outbox.entity.OutboxEvent;
import com.devtrack.outbox.repository.OutboxEventRepository;
import com.devtrack.outbox.worker.OutboxEventProcessor;
import com.devtrack.project.entity.Project;
import com.devtrack.project.entity.ProjectMember;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.project.repository.ProjectMemberRepository;
import com.devtrack.project.repository.ProjectRepository;
import com.devtrack.security.CustomUserDetails;
import com.devtrack.user.entity.User;
import com.devtrack.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class ConcurrencyIntegrationTest {

    @Autowired
    private IssueService issueService;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private ProjectCounterRepository projectCounterRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityEventRepository activityEventRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private OutboxEventProcessor outboxEventProcessor;

    @Autowired
    @Qualifier("notificationTaskExecutor")
    private ThreadPoolTaskExecutor taskExecutor;

    @Autowired
    private ExecutorMetrics executorMetrics;

    @Autowired
    private ObjectMapper objectMapper;

    private User owner;
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

        owner = userRepository.save(new User("Test Owner", "owner@example.com", "hash123"));
        project = projectRepository.save(new Project("Core System", "CORE", "Core system project", owner));
        projectMemberRepository.save(new ProjectMember(project, owner, ProjectRole.OWNER));

        // Set security context for calling thread
        CustomUserDetails userDetails = new CustomUserDetails(owner);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );
    }

    @Test
    @DisplayName("Concurrency: 20 simultaneous threads creating issues generate strictly unique, gapless issue keys")
    void testConcurrentIssueCreationDoesNotCreateDuplicateKeys() throws InterruptedException {
        int threadCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        Set<String> generatedKeys = Collections.synchronizedSet(new java.util.HashSet<>());
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    // Set security context per worker thread
                    CustomUserDetails userDetails = new CustomUserDetails(owner);
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
                    );

                    startLatch.await(); // Synchronize release of all threads

                    CreateIssueRequest request = new CreateIssueRequest(
                            "Concurrent Issue " + index,
                            "Testing concurrency key allocation",
                            IssueType.TASK,
                            IssueStatus.TODO,
                            IssuePriority.MEDIUM,
                            null,
                            null
                    );

                    IssueResponse response = issueService.createIssue(project.getId(), request);
                    generatedKeys.add(response.getKey());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Fire all 20 threads simultaneously
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);

        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(errorCount.get()).isZero();
        assertThat(successCount.get()).isEqualTo(threadCount);
        assertThat(generatedKeys).hasSize(threadCount);

        // Verify keys CORE-1 through CORE-20 all exist with zero collisions
        for (int i = 1; i <= threadCount; i++) {
            assertThat(generatedKeys).contains("CORE-" + i);
        }
    }

    @Test
    @DisplayName("Concurrency: Simultaneous updates on same issue trigger optimistic locking conflict with zero silent overwrite")
    void testConcurrentIssueUpdatesTriggerOptimisticLockingConflict() throws Exception {
        CreateIssueRequest createReq = new CreateIssueRequest(
                "Root Issue", "Description", IssueType.TASK, IssueStatus.TODO, IssuePriority.MEDIUM, null, null
        );
        IssueResponse created = issueService.createIssue(project.getId(), createReq);
        Long issueId = created.getId();
        Integer initialVersion = created.getVersion(); // version = 0

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    CustomUserDetails userDetails = new CustomUserDetails(owner);
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
                    );

                    startLatch.await(); // Synchronize all update attempts

                    UpdateIssueRequest updateReq = new UpdateIssueRequest(
                            "Updated Title " + index,
                            null, null, null, null, null, null,
                            initialVersion // All threads supply the initial version 0
                    );

                    issueService.updateIssue(issueId, updateReq);
                    successCount.incrementAndGet();
                } catch (ConflictException e) {
                    conflictCount.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        // Exactly 1 thread successfully updates, remaining 9 receive ConflictException (409)
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(threadCount - 1);

        Issue refreshed = issueRepository.findById(issueId).orElseThrow();
        assertThat(refreshed.getVersion()).isEqualTo(initialVersion + 1);
    }

    @Test
    @DisplayName("Concurrency: Bounded executor queue rejects tasks exceeding capacity (50) and tracks metrics")
    void testBoundedQueueBackpressureAndRejectionPolicy() throws Exception {
        CountDownLatch blockLatch = new CountDownLatch(1);
        CountDownLatch startedLatch = new CountDownLatch(8);

        // Total capacity = 8 active threads + 50 queue slots = 58
        for (int i = 0; i < 58; i++) {
            taskExecutor.execute(() -> {
                startedLatch.countDown();
                try {
                    blockLatch.await(10, TimeUnit.SECONDS);
                } catch (InterruptedException ignored) {
                }
            });
        }

        // Wait until all 8 worker threads have started
        startedLatch.await(5, TimeUnit.SECONDS);

        assertThat(executorMetrics.getQueueDepth()).isEqualTo(50);

        // The 59th task must trigger rejection
        assertThatThrownBy(() -> taskExecutor.execute(() -> {}))
                .isInstanceOf(RejectedExecutionException.class);

        assertThat(executorMetrics.getRejectedTaskCount()).isGreaterThan(0);

        blockLatch.countDown(); // Unblock workers
    }

    @Test
    @DisplayName("Concurrency: Outbox event processing is safe and idempotent across multiple worker runs")
    void testConcurrentWorkerOutboxDeduplication() throws Exception {
        OutboxPayload payload = new OutboxPayload(
                owner.getId(), null, owner.getId(), NotificationType.STATUS_CHANGED, "Status updated"
        );
        OutboxEvent event = outboxEventRepository.save(new OutboxEvent(
                "ISSUE", 1L, "STATUS_CHANGED", objectMapper.writeValueAsString(payload)
        ));

        // Process event
        outboxEventProcessor.processEvent(event.getId());

        // Process same event again
        outboxEventProcessor.processEvent(event.getId());

        // Exactly 1 notification should be delivered, event status PROCESSED
        assertThat(notificationRepository.countByRecipientIdAndReadAtIsNull(owner.getId())).isEqualTo(1);
        OutboxEvent processed = outboxEventRepository.findById(event.getId()).orElseThrow();
        assertThat(processed.getStatus()).isEqualTo(com.devtrack.outbox.entity.OutboxStatus.PROCESSED);
    }
}
