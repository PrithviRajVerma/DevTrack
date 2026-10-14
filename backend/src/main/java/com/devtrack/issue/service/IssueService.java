package com.devtrack.issue.service;

import com.devtrack.common.exception.BadRequestException;
import com.devtrack.common.exception.ConflictException;
import com.devtrack.common.exception.ResourceNotFoundException;
import com.devtrack.issue.dto.CreateIssueRequest;
import com.devtrack.issue.dto.IssueResponse;
import com.devtrack.issue.dto.UpdateIssueRequest;
import com.devtrack.issue.entity.*;
import com.devtrack.issue.repository.IssueRepository;
import com.devtrack.issue.repository.IssueSpecification;
import com.devtrack.issue.repository.ProjectCounterRepository;
import com.devtrack.project.entity.Project;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.project.service.ProjectService;
import com.devtrack.security.SecurityUtils;
import com.devtrack.user.entity.User;
import com.devtrack.user.service.UserService;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectCounterRepository projectCounterRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final com.devtrack.activity.service.ActivityEventService activityEventService;
    private final com.devtrack.outbox.service.OutboxEventService outboxEventService;

    public IssueService(
            IssueRepository issueRepository,
            ProjectCounterRepository projectCounterRepository,
            ProjectService projectService,
            UserService userService,
            com.devtrack.activity.service.ActivityEventService activityEventService,
            com.devtrack.outbox.service.OutboxEventService outboxEventService
    ) {
        this.issueRepository = issueRepository;
        this.projectCounterRepository = projectCounterRepository;
        this.projectService = projectService;
        this.userService = userService;
        this.activityEventService = activityEventService;
        this.outboxEventService = outboxEventService;
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new AccessDeniedException("User is not authenticated"));
        return userService.findByEmail(email);
    }

    @Transactional
    public IssueResponse createIssue(Long projectId, CreateIssueRequest request) {
        User currentUser = getCurrentUser();
        Project project = projectService.findProjectEntity(projectId);
        projectService.requireMembership(projectId, currentUser.getId());

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userService.findById(request.getAssigneeId());
            projectService.requireMembership(projectId, assignee.getId());
        }

        // Allocate issue number atomically per project
        int nextIssueNumber = allocateNextIssueNumber(project);

        Issue issue = new Issue(
                project,
                nextIssueNumber,
                request.getTitle().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getType(),
                request.getStatus(),
                request.getPriority(),
                currentUser,
                assignee,
                request.getDueDate()
        );

        Issue savedIssue = issueRepository.save(issue);

        // Record audit activity
        activityEventService.recordEvent(
                savedIssue,
                currentUser,
                com.devtrack.activity.entity.ActivityEventType.ISSUE_CREATED,
                "Created issue " + savedIssue.getKey() + ": " + savedIssue.getTitle()
        );

        if (assignee != null && !assignee.getId().equals(currentUser.getId())) {
            outboxEventService.publishEvent(
                    "ISSUE",
                    savedIssue.getId(),
                    "ISSUE_ASSIGNED",
                    new com.devtrack.outbox.dto.OutboxPayload(
                            assignee.getId(),
                            savedIssue.getId(),
                            currentUser.getId(),
                            com.devtrack.notification.entity.NotificationType.ISSUE_ASSIGNED,
                            "You were assigned to " + savedIssue.getKey() + ": " + savedIssue.getTitle()
                    )
            );
        }

        return IssueResponse.fromEntity(savedIssue);
    }

    @Transactional(readOnly = true)
    public Page<IssueResponse> getProjectIssues(
            Long projectId,
            IssueStatus status,
            IssuePriority priority,
            IssueType type,
            Long assigneeId,
            Boolean overdue,
            String search,
            Pageable pageable
    ) {
        User currentUser = getCurrentUser();
        projectService.requireMembership(projectId, currentUser.getId());

        Specification<Issue> spec = IssueSpecification.withFilters(
                projectId, status, priority, type, assigneeId, overdue, search
        );

        return issueRepository.findAll(spec, pageable).map(IssueResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IssueResponse getIssueById(Long issueId) {
        User currentUser = getCurrentUser();
        Issue issue = findIssueEntity(issueId);
        projectService.requireMembership(issue.getProject().getId(), currentUser.getId());

        return IssueResponse.fromEntity(issue);
    }

    @Transactional
    public IssueResponse updateIssue(Long issueId, UpdateIssueRequest request) {
        User currentUser = getCurrentUser();
        Issue issue = findIssueEntity(issueId);
        Long projectId = issue.getProject().getId();
        projectService.requireMembership(projectId, currentUser.getId());

        // Optimistic locking check against stale client updates
        if (!issue.getVersion().equals(request.getVersion())) {
            throw new ConflictException("Issue has been updated by another user. Current version: "
                    + issue.getVersion() + ", provided version: " + request.getVersion());
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            issue.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            issue.setDescription(request.getDescription().trim());
        }
        if (request.getType() != null) {
            issue.setType(request.getType());
        }
        if (request.getStatus() != null && request.getStatus() != issue.getStatus()) {
            activityEventService.recordEvent(
                    issue,
                    currentUser,
                    com.devtrack.activity.entity.ActivityEventType.STATUS_CHANGED,
                    "Changed status from " + issue.getStatus() + " to " + request.getStatus()
            );
            issue.setStatus(request.getStatus());

            if (issue.getAssignee() != null && !issue.getAssignee().getId().equals(currentUser.getId())) {
                outboxEventService.publishEvent(
                        "ISSUE",
                        issue.getId(),
                        "STATUS_CHANGED",
                        new com.devtrack.outbox.dto.OutboxPayload(
                                issue.getAssignee().getId(),
                                issue.getId(),
                                currentUser.getId(),
                                com.devtrack.notification.entity.NotificationType.STATUS_CHANGED,
                                "Status for " + issue.getKey() + " changed to " + request.getStatus()
                        )
                );
            }
        }
        if (request.getPriority() != null && request.getPriority() != issue.getPriority()) {
            activityEventService.recordEvent(
                    issue,
                    currentUser,
                    com.devtrack.activity.entity.ActivityEventType.PRIORITY_CHANGED,
                    "Changed priority from " + issue.getPriority() + " to " + request.getPriority()
            );
            issue.setPriority(request.getPriority());
        }
        if (request.getDueDate() != null) {
            issue.setDueDate(request.getDueDate());
        }

        if (request.getAssigneeId() != null) {
            if (request.getAssigneeId() == 0) {
                if (issue.getAssignee() != null) {
                    activityEventService.recordEvent(
                            issue,
                            currentUser,
                            com.devtrack.activity.entity.ActivityEventType.ASSIGNEE_CHANGED,
                            "Removed assignee " + issue.getAssignee().getName()
                    );
                    issue.setAssignee(null);
                }
            } else {
                User newAssignee = userService.findById(request.getAssigneeId());
                projectService.requireMembership(projectId, newAssignee.getId());
                activityEventService.recordEvent(
                        issue,
                        currentUser,
                        com.devtrack.activity.entity.ActivityEventType.ASSIGNEE_CHANGED,
                        "Assigned issue to " + newAssignee.getName()
                );
                issue.setAssignee(newAssignee);

                if (!newAssignee.getId().equals(currentUser.getId())) {
                    outboxEventService.publishEvent(
                            "ISSUE",
                            issue.getId(),
                            "ISSUE_ASSIGNED",
                            new com.devtrack.outbox.dto.OutboxPayload(
                                    newAssignee.getId(),
                                    issue.getId(),
                                    currentUser.getId(),
                                    com.devtrack.notification.entity.NotificationType.ISSUE_ASSIGNED,
                                    "You were assigned to " + issue.getKey() + ": " + issue.getTitle()
                            )
                    );
                }
            }
        }

        try {
            Issue updatedIssue = issueRepository.saveAndFlush(issue);
            return IssueResponse.fromEntity(updatedIssue);
        } catch (OptimisticLockingFailureException e) {
            throw new ConflictException("Concurrent modification detected. Please refresh and try again.");
        }
    }

    @Transactional
    public void deleteIssue(Long issueId) {
        User currentUser = getCurrentUser();
        Issue issue = findIssueEntity(issueId);
        Long projectId = issue.getProject().getId();
        projectService.requireMembership(projectId, currentUser.getId());

        ProjectRole role = projectService.getMemberRole(projectId, currentUser.getId());
        boolean isReporter = issue.getReporter().getId().equals(currentUser.getId());
        boolean isOwner = role == ProjectRole.OWNER;

        if (!isReporter && !isOwner) {
            throw new AccessDeniedException("Only the issue reporter or project owner can delete an issue");
        }

        issueRepository.delete(issue);
    }

    @Transactional(readOnly = true)
    public Issue findIssueEntity(Long issueId) {
        return issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));
    }

    private int allocateNextIssueNumber(Project project) {
        return projectCounterRepository.getNextIssueNumber(project.getId());
    }
}
