package com.devtrack.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateProjectRequest {

    @NotBlank(message = "Project name must not be blank")
    @Size(max = 150, message = "Project name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Project key must not be blank")
    @Pattern(regexp = "^[A-Z0-9]{2,10}$", message = "Project key must be 2-10 uppercase alphanumeric characters (e.g. DEV, WEB, API)")
    private String projectKey;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    public CreateProjectRequest() {
    }

    public CreateProjectRequest(String name, String projectKey, String description) {
        this.name = name;
        this.projectKey = projectKey;
        this.description = description;
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
}
