package com.devtrack.issue.dto;

import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.entity.IssueType;
import com.devtrack.user.dto.UserResponse;

import java.time.Instant;
import java.time.LocalDate;

public class IssueResponse {

    private Long id;
    private Long projectId;
    private String projectKey;
    private Integer issueNumber;
    private String key;
    private String title;
    private String description;
    private IssueType type;
    private IssueStatus status;
    private IssuePriority priority;
    private UserResponse reporter;
    private UserResponse assignee;
    private LocalDate dueDate;
    private Integer version;
    private Instant createdAt;
    private Instant updatedAt;

    public IssueResponse() {
    }

    public IssueResponse(
            Long id,
            Long projectId,
            String projectKey,
            Integer issueNumber,
            String key,
            String title,
            String description,
            IssueType type,
            IssueStatus status,
            IssuePriority priority,
            UserResponse reporter,
            UserResponse assignee,
            LocalDate dueDate,
            Integer version,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.projectKey = projectKey;
        this.issueNumber = issueNumber;
        this.key = key;
        this.title = title;
        this.description = description;
        this.type = type;
        this.status = status;
        this.priority = priority;
        this.reporter = reporter;
        this.assignee = assignee;
        this.dueDate = dueDate;
        this.version = version;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static IssueResponse fromEntity(Issue issue) {
        if (issue == null) {
            return null;
        }
        return new IssueResponse(
                issue.getId(),
                issue.getProject().getId(),
                issue.getProject().getProjectKey(),
                issue.getIssueNumber(),
                issue.getKey(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getType(),
                issue.getStatus(),
                issue.getPriority(),
                UserResponse.fromEntity(issue.getReporter()),
                issue.getAssignee() != null ? UserResponse.fromEntity(issue.getAssignee()) : null,
                issue.getDueDate(),
                issue.getVersion(),
                issue.getCreatedAt(),
                issue.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectKey() {
        return projectKey;
    }

    public void setProjectKey(String projectKey) {
        this.projectKey = projectKey;
    }

    public Integer getIssueNumber() {
        return issueNumber;
    }

    public void setIssueNumber(Integer issueNumber) {
        this.issueNumber = issueNumber;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
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

    public UserResponse getReporter() {
        return reporter;
    }

    public void setReporter(UserResponse reporter) {
        this.reporter = reporter;
    }

    public UserResponse getAssignee() {
        return assignee;
    }

    public void setAssignee(UserResponse assignee) {
        this.assignee = assignee;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
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
