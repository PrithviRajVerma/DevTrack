package com.devtrack.comment.service;

import com.devtrack.activity.entity.ActivityEventType;
import com.devtrack.activity.service.ActivityEventService;
import com.devtrack.comment.dto.CommentResponse;
import com.devtrack.comment.dto.CreateCommentRequest;
import com.devtrack.comment.dto.UpdateCommentRequest;
import com.devtrack.comment.entity.Comment;
import com.devtrack.comment.repository.CommentRepository;
import com.devtrack.common.exception.ResourceNotFoundException;
import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.repository.IssueRepository;
import com.devtrack.project.entity.ProjectMember;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.project.repository.ProjectMemberRepository;
import com.devtrack.project.service.ProjectService;
import com.devtrack.security.SecurityUtils;
import com.devtrack.user.entity.User;
import com.devtrack.user.service.UserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final ProjectService projectService;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserService userService;
    private final ActivityEventService activityEventService;
    private final com.devtrack.outbox.service.OutboxEventService outboxEventService;

    public CommentService(
            CommentRepository commentRepository,
            IssueRepository issueRepository,
            ProjectService projectService,
            ProjectMemberRepository projectMemberRepository,
            UserService userService,
            ActivityEventService activityEventService,
            com.devtrack.outbox.service.OutboxEventService outboxEventService
    ) {
        this.commentRepository = commentRepository;
        this.issueRepository = issueRepository;
        this.projectService = projectService;
        this.projectMemberRepository = projectMemberRepository;
        this.userService = userService;
        this.activityEventService = activityEventService;
        this.outboxEventService = outboxEventService;
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new AccessDeniedException("User is not authenticated"));
        return userService.findByEmail(email);
    }

    private Issue findIssue(Long issueId) {
        return issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));
    }

    private Comment findComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
    }

    @Transactional
    public CommentResponse addComment(Long issueId, CreateCommentRequest request) {
        User currentUser = getCurrentUser();
        Issue issue = findIssue(issueId);
        Long projectId = issue.getProject().getId();
        projectService.requireMembership(projectId, currentUser.getId());

        Comment comment = new Comment(issue, currentUser, request.body().trim());
        Comment savedComment = commentRepository.save(comment);

        // Record audit activity
        String snippet = request.body().trim();
        if (snippet.length() > 60) {
            snippet = snippet.substring(0, 57) + "...";
        }
        activityEventService.recordEvent(
                issue,
                currentUser,
                ActivityEventType.COMMENT_ADDED,
                "Added comment: \"" + snippet + "\""
        );

        if (issue.getAssignee() != null && !issue.getAssignee().getId().equals(currentUser.getId())) {
            outboxEventService.publishEvent(
                    "COMMENT",
                    savedComment.getId(),
                    "COMMENT_ADDED",
                    new com.devtrack.outbox.dto.OutboxPayload(
                            issue.getAssignee().getId(),
                            issue.getId(),
                            currentUser.getId(),
                            com.devtrack.notification.entity.NotificationType.COMMENT_ADDED,
                            currentUser.getName() + " commented on " + issue.getKey() + ": \"" + snippet + "\""
                    )
            );
        }

        return CommentResponse.fromEntity(savedComment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getIssueComments(Long issueId) {
        User currentUser = getCurrentUser();
        Issue issue = findIssue(issueId);
        projectService.requireMembership(issue.getProject().getId(), currentUser.getId());

        return commentRepository.findByIssueIdWithAuthor(issueId).stream()
                .map(CommentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, UpdateCommentRequest request) {
        User currentUser = getCurrentUser();
        Comment comment = findComment(commentId);
        Long projectId = comment.getIssue().getProject().getId();
        projectService.requireMembership(projectId, currentUser.getId());

        // Only author can edit the comment text
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the author can edit this comment");
        }

        comment.setBody(request.body().trim());
        return CommentResponse.fromEntity(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User currentUser = getCurrentUser();
        Comment comment = findComment(commentId);
        Issue issue = comment.getIssue();
        Long projectId = issue.getProject().getId();
        projectService.requireMembership(projectId, currentUser.getId());
        ProjectRole role = projectService.getMemberRole(projectId, currentUser.getId());

        // Author or Project OWNER can delete
        boolean isAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isOwner = role == ProjectRole.OWNER;

        if (!isAuthor && !isOwner) {
            throw new AccessDeniedException("You do not have permission to delete this comment");
        }

        commentRepository.delete(comment);

        activityEventService.recordEvent(
                issue,
                currentUser,
                ActivityEventType.COMMENT_DELETED,
                "Deleted a comment"
        );
    }
}
