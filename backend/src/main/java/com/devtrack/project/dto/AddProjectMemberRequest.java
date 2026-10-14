package com.devtrack.project.dto;

import com.devtrack.project.entity.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AddProjectMemberRequest {

    @NotBlank(message = "Email must not be blank")
    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Role must not be null")
    private ProjectRole role = ProjectRole.MEMBER;

    public AddProjectMemberRequest() {
    }

    public AddProjectMemberRequest(String email, ProjectRole role) {
        this.email = email;
        this.role = role != null ? role : ProjectRole.MEMBER;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectRole role) {
        this.role = role;
    }
}
