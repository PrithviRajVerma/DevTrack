package com.devtrack.project.dto;

import jakarta.validation.constraints.Size;

public class UpdateProjectRequest {

    @Size(min = 1, max = 150, message = "Project name must be between 1 and 150 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    public UpdateProjectRequest() {
    }

    public UpdateProjectRequest(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
