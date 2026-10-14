package com.devtrack.comment.controller;

import com.devtrack.comment.dto.CommentResponse;
import com.devtrack.comment.dto.CreateCommentRequest;
import com.devtrack.comment.dto.UpdateCommentRequest;
import com.devtrack.comment.service.CommentService;
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
@Tag(name = "Comments", description = "Endpoints for issue comments and discussions")
@SecurityRequirement(name = "bearerAuth")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/api/issues/{issueId}/comments")
    @Operation(summary = "Add comment", description = "Adds a new comment to an issue if user is a member of the project.")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long issueId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        CommentResponse response = commentService.addComment(issueId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/issues/{issueId}/comments")
    @Operation(summary = "List issue comments", description = "Returns all comments for the issue in chronological order.")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long issueId) {
        return ResponseEntity.ok(commentService.getIssueComments(issueId));
    }

    @PatchMapping("/api/comments/{commentId}")
    @Operation(summary = "Update comment", description = "Updates a comment body (author only).")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request
    ) {
        return ResponseEntity.ok(commentService.updateComment(commentId, request));
    }

    @DeleteMapping("/api/comments/{commentId}")
    @Operation(summary = "Delete comment", description = "Deletes a comment (author or project lead only).")
    public ResponseEntity<Map<String, String>> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }
}
