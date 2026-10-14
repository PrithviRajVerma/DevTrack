package com.devtrack.issue.controller;

import com.devtrack.issue.dto.CreateIssueRequest;
import com.devtrack.issue.dto.IssueResponse;
import com.devtrack.issue.dto.UpdateIssueRequest;
import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.entity.IssueType;
import com.devtrack.issue.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@Tag(name = "Issues", description = "Endpoints for issue management, assignment, and status updates")
@SecurityRequirement(name = "bearerAuth")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @PostMapping("/api/projects/{projectId}/issues")
    @Operation(summary = "Create issue", description = "Creates a new issue in the project with an atomically assigned issue number.")
    public ResponseEntity<IssueResponse> createIssue(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateIssueRequest request
    ) {
        IssueResponse response = issueService.createIssue(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/projects/{projectId}/issues")
    @Operation(summary = "List project issues", description = "Returns paginated and filtered issues belonging to the project.")
    public ResponseEntity<Page<IssueResponse>> getIssues(
            @PathVariable Long projectId,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssuePriority priority,
            @RequestParam(required = false) IssueType type,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<IssueResponse> issues = issueService.getProjectIssues(
                projectId, status, priority, type, assigneeId, overdue, search, pageable
        );
        return ResponseEntity.ok(issues);
    }

    @GetMapping("/api/issues/{issueId}")
    @Operation(summary = "Get issue details", description = "Returns full issue details if user is a member of the project.")
    public ResponseEntity<IssueResponse> getIssue(@PathVariable Long issueId) {
        return ResponseEntity.ok(issueService.getIssueById(issueId));
    }

    @PatchMapping("/api/issues/{issueId}")
    @Operation(summary = "Update issue", description = "Updates issue fields with optimistic locking protection against stale versions.")
    public ResponseEntity<IssueResponse> updateIssue(
            @PathVariable Long issueId,
            @Valid @RequestBody UpdateIssueRequest request
    ) {
        return ResponseEntity.ok(issueService.updateIssue(issueId, request));
    }

    @DeleteMapping("/api/issues/{issueId}")
    @Operation(summary = "Delete issue", description = "Deletes an issue (reporter or project owner only).")
    public ResponseEntity<Map<String, String>> deleteIssue(@PathVariable Long issueId) {
        issueService.deleteIssue(issueId);
        return ResponseEntity.ok(Map.of("message", "Issue deleted successfully"));
    }
}
