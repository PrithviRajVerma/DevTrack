package com.devtrack.activity.controller;

import com.devtrack.activity.dto.ActivityEventResponse;
import com.devtrack.activity.service.ActivityEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Activity", description = "Endpoints for issue activity audit history")
@SecurityRequirement(name = "bearerAuth")
public class ActivityController {

    private final ActivityEventService activityEventService;

    public ActivityController(ActivityEventService activityEventService) {
        this.activityEventService = activityEventService;
    }

    @GetMapping("/api/issues/{issueId}/activity")
    @Operation(summary = "Get issue activity timeline", description = "Returns chronological audit trail for the issue.")
    public ResponseEntity<List<ActivityEventResponse>> getIssueActivity(@PathVariable Long issueId) {
        return ResponseEntity.ok(activityEventService.getIssueActivity(issueId));
    }
}
