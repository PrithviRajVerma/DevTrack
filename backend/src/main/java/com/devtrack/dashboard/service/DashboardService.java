package com.devtrack.dashboard.service;

import com.devtrack.activity.dto.ActivityEventResponse;
import com.devtrack.activity.service.ActivityEventService;
import com.devtrack.dashboard.dto.AssigneeWorkloadResponse;
import com.devtrack.dashboard.dto.DashboardSummaryResponse;
import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.repository.IssueRepository;
import com.devtrack.project.repository.ProjectMemberRepository;
import com.devtrack.project.service.ProjectService;
import com.devtrack.security.SecurityUtils;
import com.devtrack.user.entity.User;
import com.devtrack.user.service.UserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class DashboardService {

    private final IssueRepository issueRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final ActivityEventService activityEventService;

    public DashboardService(
            IssueRepository issueRepository,
            ProjectMemberRepository projectMemberRepository,
            ProjectService projectService,
            UserService userService,
            ActivityEventService activityEventService
    ) {
        this.issueRepository = issueRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.projectService = projectService;
        this.userService = userService;
        this.activityEventService = activityEventService;
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new AccessDeniedException("User is not authenticated"));
        return userService.findByEmail(email);
    }

    private List<Long> resolveProjectIds(Long projectId, Long currentUserId) {
        if (projectId != null) {
            projectService.requireMembership(projectId, currentUserId);
            return List.of(projectId);
        }
        return projectMemberRepository.findProjectIdsByUserId(currentUserId);
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(Long projectId) {
        User currentUser = getCurrentUser();
        List<Long> projectIds = resolveProjectIds(projectId, currentUser.getId());

        Map<IssueStatus, Long> statusMap = new EnumMap<>(IssueStatus.class);
        for (IssueStatus status : IssueStatus.values()) {
            statusMap.put(status, 0L);
        }

        Map<IssuePriority, Long> priorityMap = new EnumMap<>(IssuePriority.class);
        for (IssuePriority priority : IssuePriority.values()) {
            priorityMap.put(priority, 0L);
        }

        if (projectIds.isEmpty()) {
            return new DashboardSummaryResponse(0, 0, 0, statusMap, priorityMap);
        }

        long total = issueRepository.countByProjectIds(projectIds);
        long openAssigned = issueRepository.countOpenAssignedToUserInProjectIds(projectIds, currentUser.getId());
        long overdue = issueRepository.countOverdueInProjectIds(projectIds, LocalDate.now());

        List<Object[]> statusCounts = issueRepository.countByStatusInProjectIds(projectIds);
        for (Object[] row : statusCounts) {
            IssueStatus st = (IssueStatus) row[0];
            Long cnt = ((Number) row[1]).longValue();
            statusMap.put(st, cnt);
        }

        List<Object[]> priorityCounts = issueRepository.countByPriorityInProjectIds(projectIds);
        for (Object[] row : priorityCounts) {
            IssuePriority pr = (IssuePriority) row[0];
            Long cnt = ((Number) row[1]).longValue();
            priorityMap.put(pr, cnt);
        }

        return new DashboardSummaryResponse(total, openAssigned, overdue, statusMap, priorityMap);
    }

    @Transactional(readOnly = true)
    public List<AssigneeWorkloadResponse> getWorkload(Long projectId) {
        User currentUser = getCurrentUser();
        List<Long> projectIds = resolveProjectIds(projectId, currentUser.getId());

        if (projectIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Object[]> rows = issueRepository.findWorkloadByAssigneeInProjectIds(projectIds);
        List<AssigneeWorkloadResponse> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long userId = (Long) row[0];
            String name = (String) row[1];
            String email = (String) row[2];
            long totalAssigned = ((Number) row[3]).longValue();
            long openCount = ((Number) row[4]).longValue();
            long doneCount = ((Number) row[5]).longValue();

            result.add(new AssigneeWorkloadResponse(userId, name, email, totalAssigned, openCount, doneCount));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<ActivityEventResponse> getRecentActivity(int limit) {
        return activityEventService.getRecentActivityForCurrentUser(limit);
    }
}
