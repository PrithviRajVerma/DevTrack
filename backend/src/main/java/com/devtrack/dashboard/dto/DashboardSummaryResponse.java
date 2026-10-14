package com.devtrack.dashboard.dto;

import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;

import java.util.Map;

public record DashboardSummaryResponse(
        long totalIssues,
        long openIssuesAssignedToMe,
        long overdueIssues,
        Map<IssueStatus, Long> statusBreakdown,
        Map<IssuePriority, Long> priorityBreakdown
) {}
