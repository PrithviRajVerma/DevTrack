package com.devtrack.dashboard.controller;

import com.devtrack.activity.dto.ActivityEventResponse;
import com.devtrack.dashboard.dto.AssigneeWorkloadResponse;
import com.devtrack.dashboard.dto.DashboardSummaryResponse;
import com.devtrack.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Dashboard", description = "Endpoints for live project analytics, metrics, workload, and activity")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/api/dashboard/summary")
    @Operation(summary = "Get dashboard metrics summary", description = "Returns aggregated totals, status breakdown, and overdue metrics across user projects or specific project.")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @RequestParam(required = false) Long projectId
    ) {
        return ResponseEntity.ok(dashboardService.getSummary(projectId));
    }

    @GetMapping("/api/dashboard/workload")
    @Operation(summary = "Get assignee workload breakdown", description = "Returns issue distribution and open vs done counts per assignee.")
    public ResponseEntity<List<AssigneeWorkloadResponse>> getWorkload(
            @RequestParam(required = false) Long projectId
    ) {
        return ResponseEntity.ok(dashboardService.getWorkload(projectId));
    }

    @GetMapping("/api/dashboard/recent-activity")
    @Operation(summary = "Get recent activity feed", description = "Returns latest activity events across projects the user has access to.")
    public ResponseEntity<List<ActivityEventResponse>> getRecentActivity(
            @RequestParam(defaultValue = "15") int limit
    ) {
        return ResponseEntity.ok(dashboardService.getRecentActivity(limit));
    }
}
