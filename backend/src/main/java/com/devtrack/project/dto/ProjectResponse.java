package com.devtrack.project.dto;

import com.devtrack.project.entity.Project;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.user.dto.UserResponse;

import java.time.Instant;

public class ProjectResponse {

    private Long id;
    private String name;
    private String projectKey;
    private String description;
    private UserResponse owner;
    private ProjectRole currentUserRole;
    private long memberCount;
    private Instant createdAt;
    private Instant updatedAt;

    public ProjectResponse() {
    }

    public ProjectResponse(Long id, String name, String projectKey, String description, UserResponse owner, ProjectRole currentUserRole, long memberCount, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.projectKey = projectKey;
        this.description = description;
        this.owner = owner;
        this.currentUserRole = currentUserRole;
        this.memberCount = memberCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ProjectResponse fromEntity(Project project, ProjectRole currentUserRole, long memberCount) {
        if (project == null) {
            return null;
        }
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getProjectKey(),
                project.getDescription(),
                UserResponse.fromEntity(project.getOwner()),
                currentUserRole,
                memberCount,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProjectKey() {
        return projectKey;
    }

    public void setProjectKey(String projectKey) {
        this.projectKey = projectKey;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UserResponse getOwner() {
        return owner;
    }

    public void setOwner(UserResponse owner) {
        this.owner = owner;
    }

    public ProjectRole getCurrentUserRole() {
        return currentUserRole;
    }

    public void setCurrentUserRole(ProjectRole currentUserRole) {
        this.currentUserRole = currentUserRole;
    }

    public long getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(long memberCount) {
        this.memberCount = memberCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
