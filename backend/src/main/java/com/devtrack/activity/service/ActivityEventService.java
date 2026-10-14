package com.devtrack.activity.service;

import com.devtrack.activity.dto.ActivityEventResponse;
import com.devtrack.activity.entity.ActivityEvent;
import com.devtrack.activity.entity.ActivityEventType;
import com.devtrack.activity.repository.ActivityEventRepository;
import com.devtrack.issue.entity.Issue;
import com.devtrack.project.service.ProjectService;
import com.devtrack.security.SecurityUtils;
import com.devtrack.user.entity.User;
import com.devtrack.user.service.UserService;
import com.devtrack.common.exception.ResourceNotFoundException;
import com.devtrack.issue.repository.IssueRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ActivityEventService {

    private final ActivityEventRepository activityEventRepository;
    private final IssueRepository issueRepository;
    private final ProjectService projectService;
    private final UserService userService;

    public ActivityEventService(
            ActivityEventRepository activityEventRepository,
            IssueRepository issueRepository,
            ProjectService projectService,
            UserService userService
    ) {
        this.activityEventRepository = activityEventRepository;
        this.issueRepository = issueRepository;
        this.projectService = projectService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new AccessDeniedException("User is not authenticated"));
        return userService.findByEmail(email);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public ActivityEvent recordEvent(Issue issue, User actor, ActivityEventType eventType, String details) {
        ActivityEvent event = new ActivityEvent(issue, actor, eventType, details);
        return activityEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<ActivityEventResponse> getIssueActivity(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));
        return getIssueActivity(issue);
    }

    @Transactional(readOnly = true)
    public List<ActivityEventResponse> getIssueActivity(Issue issue) {
        User currentUser = getCurrentUser();
        projectService.requireMembership(issue.getProject().getId(), currentUser.getId());

        return activityEventRepository.findByIssueIdOrderByCreatedAtDesc(issue.getId()).stream()
                .map(ActivityEventResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityEventResponse> getRecentActivityForCurrentUser(int limit) {
        User currentUser = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(0, Math.min(limit, 50));

        return activityEventRepository.findRecentActivityForUser(currentUser.getId(), pageRequest).stream()
                .map(ActivityEventResponse::fromEntity)
                .toList();
    }
}
