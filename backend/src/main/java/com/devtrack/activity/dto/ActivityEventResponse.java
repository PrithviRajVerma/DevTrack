package com.devtrack.activity.dto;

import com.devtrack.activity.entity.ActivityEvent;
import com.devtrack.activity.entity.ActivityEventType;
import com.devtrack.user.dto.UserResponse;

import java.time.Instant;

public class ActivityEventResponse {

    private Long id;
    private Long issueId;
    private String issueKey;
    private String issueTitle;
    private UserResponse actor;
    private ActivityEventType eventType;
    private String details;
    private Instant createdAt;

    public ActivityEventResponse() {
    }

    public ActivityEventResponse(Long id, Long issueId, String issueKey, String issueTitle, UserResponse actor, ActivityEventType eventType, String details, Instant createdAt) {
        this.id = id;
        this.issueId = issueId;
        this.issueKey = issueKey;
        this.issueTitle = issueTitle;
        this.actor = actor;
        this.eventType = eventType;
        this.details = details;
        this.createdAt = createdAt;
    }

    public static ActivityEventResponse fromEntity(ActivityEvent event) {
        if (event == null) {
            return null;
        }
        return new ActivityEventResponse(
                event.getId(),
                event.getIssue().getId(),
                event.getIssue().getKey(),
                event.getIssue().getTitle(),
                UserResponse.fromEntity(event.getActor()),
                event.getEventType(),
                event.getDetails(),
                event.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public String getIssueKey() {
        return issueKey;
    }

    public void setIssueKey(String issueKey) {
        this.issueKey = issueKey;
    }

    public String getIssueTitle() {
        return issueTitle;
    }

    public void setIssueTitle(String issueTitle) {
        this.issueTitle = issueTitle;
    }

    public UserResponse getActor() {
        return actor;
    }

    public void setActor(UserResponse actor) {
        this.actor = actor;
    }

    public ActivityEventType getEventType() {
        return eventType;
    }

    public void setEventType(ActivityEventType eventType) {
        this.eventType = eventType;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
