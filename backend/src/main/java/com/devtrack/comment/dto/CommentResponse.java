package com.devtrack.comment.dto;

import com.devtrack.comment.entity.Comment;
import com.devtrack.user.dto.UserResponse;

import java.time.Instant;

public class CommentResponse {

    private Long id;
    private Long issueId;
    private UserResponse author;
    private String body;
    private Instant createdAt;
    private Instant updatedAt;

    public CommentResponse() {
    }

    public CommentResponse(Long id, Long issueId, UserResponse author, String body, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.issueId = issueId;
        this.author = author;
        this.body = body;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static CommentResponse fromEntity(Comment comment) {
        if (comment == null) {
            return null;
        }
        return new CommentResponse(
                comment.getId(),
                comment.getIssue().getId(),
                UserResponse.fromEntity(comment.getAuthor()),
                comment.getBody(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
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

    public UserResponse getAuthor() {
        return author;
    }

    public void setAuthor(UserResponse author) {
        this.author = author;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
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
