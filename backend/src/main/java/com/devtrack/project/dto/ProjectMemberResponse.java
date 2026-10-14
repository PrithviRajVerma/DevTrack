package com.devtrack.project.dto;

import com.devtrack.project.entity.ProjectMember;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.user.dto.UserResponse;

import java.time.Instant;

public class ProjectMemberResponse {

    private Long id;
    private UserResponse user;
    private ProjectRole role;
    private Instant joinedAt;

    public ProjectMemberResponse() {
    }

    public ProjectMemberResponse(Long id, UserResponse user, ProjectRole role, Instant joinedAt) {
        this.id = id;
        this.user = user;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public static ProjectMemberResponse fromEntity(ProjectMember member) {
        if (member == null) {
            return null;
        }
        return new ProjectMemberResponse(
                member.getId(),
                UserResponse.fromEntity(member.getUser()),
                member.getRole(),
                member.getJoinedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectRole role) {
        this.role = role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}
