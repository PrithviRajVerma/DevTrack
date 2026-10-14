package com.devtrack.project.controller;

import com.devtrack.project.dto.*;
import com.devtrack.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Endpoints for project lifecycle and membership management")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @Operation(summary = "Create a new project", description = "Creates a project with unique key and sets creator as OWNER.")
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse response = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List accessible projects", description = "Returns all projects where the authenticated user is owner or member.")
    public ResponseEntity<List<ProjectResponse>> listProjects() {
        return ResponseEntity.ok(projectService.getAccessibleProjects());
    }

    @GetMapping("/{projectId}")
    @Operation(summary = "Get project details", description = "Returns project info if the user is a member.")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProjectById(projectId));
    }

    @PatchMapping("/{projectId}")
    @Operation(summary = "Update project", description = "Updates project name and description (OWNER only).")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateProjectRequest request
    ) {
        return ResponseEntity.ok(projectService.updateProject(projectId, request));
    }

    @GetMapping("/{projectId}/members")
    @Operation(summary = "List project members", description = "Returns all members of the specified project.")
    public ResponseEntity<List<ProjectMemberResponse>> listMembers(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProjectMembers(projectId));
    }

    @PostMapping("/{projectId}/members")
    @Operation(summary = "Add project member", description = "Adds a user by email to the project (OWNER only).")
    public ResponseEntity<ProjectMemberResponse> addMember(
            @PathVariable Long projectId,
            @Valid @RequestBody AddProjectMemberRequest request
    ) {
        ProjectMemberResponse response = projectService.addProjectMember(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    @Operation(summary = "Remove project member", description = "Removes a user from the project (OWNER only).")
    public ResponseEntity<Map<String, String>> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long userId
    ) {
        projectService.removeProjectMember(projectId, userId);
        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }
}
