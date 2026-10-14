package com.devtrack.issue.dto;

import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.entity.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class CreateIssueRequest {

    @NotBlank(message = "Title must not be blank")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    private IssueType type = IssueType.TASK;

    private IssueStatus status = IssueStatus.TODO;

    private IssuePriority priority = IssuePriority.MEDIUM;

    private Long assigneeId;

    private LocalDate dueDate;

    public CreateIssueRequest() {
    }

    public CreateIssueRequest(String title, String description, IssueType type, IssueStatus status, IssuePriority priority, Long assigneeId, LocalDate dueDate) {
        this.title = title;
        this.description = description;
        this.type = type != null ? type : IssueType.TASK;
        this.status = status != null ? status : IssueStatus.TODO;
        this.priority = priority != null ? priority : IssuePriority.MEDIUM;
        this.assigneeId = assigneeId;
        this.dueDate = dueDate;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public IssueType getType() {
        return type;
    }

    public void setType(IssueType type) {
        this.type = type;
    }

    public IssueStatus getStatus() {
        return status;
    }

    public void setStatus(IssueStatus status) {
        this.status = status;
    }

    public IssuePriority getPriority() {
        return priority;
    }

    public void setPriority(IssuePriority priority) {
        this.priority = priority;
    }

    public Long getAssigneeId() {
        return assigneeId;
    }

    public void setAssigneeId(Long assigneeId) {
        this.assigneeId = assigneeId;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}
