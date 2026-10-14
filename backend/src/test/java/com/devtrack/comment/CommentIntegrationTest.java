package com.devtrack.comment;

import com.devtrack.activity.entity.ActivityEventType;
import com.devtrack.activity.repository.ActivityEventRepository;
import com.devtrack.comment.dto.CreateCommentRequest;
import com.devtrack.comment.dto.UpdateCommentRequest;
import com.devtrack.comment.entity.Comment;
import com.devtrack.comment.repository.CommentRepository;
import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.entity.IssueType;
import com.devtrack.issue.repository.IssueRepository;
import com.devtrack.issue.repository.ProjectCounterRepository;
import com.devtrack.project.entity.Project;
import com.devtrack.project.entity.ProjectMember;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.project.repository.ProjectMemberRepository;
import com.devtrack.project.repository.ProjectRepository;
import com.devtrack.security.JwtService;
import com.devtrack.user.entity.User;
import com.devtrack.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private ProjectCounterRepository projectCounterRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ActivityEventRepository activityEventRepository;

    @Autowired
    private JwtService jwtService;

    private User owner;
    private User member;
    private User outsider;
    private String ownerToken;
    private String memberToken;
    private String outsiderToken;
    private Project project;
    private Issue testIssue;

    @BeforeEach
    void setUp() {
        activityEventRepository.deleteAll();
        commentRepository.deleteAll();
        issueRepository.deleteAll();
        projectCounterRepository.deleteAll();
        projectMemberRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(new User("Alice Owner", "alice@example.com", "hash123"));
        member = userRepository.save(new User("Bob Member", "bob@example.com", "hash123"));
        outsider = userRepository.save(new User("Eve Outsider", "eve@example.com", "hash123"));

        ownerToken = jwtService.generateToken(owner);
        memberToken = jwtService.generateToken(member);
        outsiderToken = jwtService.generateToken(outsider);

        project = projectRepository.save(new Project("Core System", "CORE", "Core system project", owner));
        projectMemberRepository.save(new ProjectMember(project, owner, ProjectRole.OWNER));
        projectMemberRepository.save(new ProjectMember(project, member, ProjectRole.MEMBER));

        testIssue = issueRepository.save(new Issue(
                project,
                1,
                "Initial task",
                "Description of initial task",
                IssueType.TASK,
                IssueStatus.TODO,
                IssuePriority.MEDIUM,
                owner,
                member,
                null
        ));
    }

    @Test
    @DisplayName("POST /api/issues/{id}/comments adds comment and logs COMMENT_ADDED activity event")
    void shouldAddCommentAndCreateActivityEvent() throws Exception {
        CreateCommentRequest request = new CreateCommentRequest("Investigating the bug now.");

        mockMvc.perform(post("/api/issues/" + testIssue.getId() + "/comments")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.body").value("Investigating the bug now."))
                .andExpect(jsonPath("$.author.name").value("Bob Member"))
                .andExpect(jsonPath("$.issueId").value(testIssue.getId()));

        assertThat(commentRepository.countByIssueId(testIssue.getId())).isEqualTo(1);

        // Verify activity event was recorded
        mockMvc.perform(get("/api/issues/" + testIssue.getId() + "/activity")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].eventType").value(ActivityEventType.COMMENT_ADDED.name()))
                .andExpect(jsonPath("$[0].actor.name").value("Bob Member"));
    }

    @Test
    @DisplayName("POST /api/issues/{id}/comments rejects comment from non-project outsider (403)")
    void shouldRejectCommentFromOutsider() throws Exception {
        CreateCommentRequest request = new CreateCommentRequest("Sneaking a comment in");

        mockMvc.perform(post("/api/issues/" + testIssue.getId() + "/comments")
                        .header("Authorization", "Bearer " + outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        assertThat(commentRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("PATCH /api/comments/{id} allows author to edit their own comment")
    void shouldAllowAuthorToUpdateComment() throws Exception {
        Comment comment = commentRepository.save(new Comment(testIssue, member, "Initial draft"));

        UpdateCommentRequest updateRequest = new UpdateCommentRequest("Revised comment text");

        mockMvc.perform(patch("/api/comments/" + comment.getId())
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("Revised comment text"));

        Comment updated = commentRepository.findById(comment.getId()).orElseThrow();
        assertThat(updated.getBody()).isEqualTo("Revised comment text");
    }

    @Test
    @DisplayName("PATCH /api/comments/{id} rejects editing by non-author (403)")
    void shouldRejectCommentUpdateFromNonAuthor() throws Exception {
        Comment comment = commentRepository.save(new Comment(testIssue, member, "Bob original text"));

        UpdateCommentRequest updateRequest = new UpdateCommentRequest("Alice hijacked text");

        mockMvc.perform(patch("/api/comments/" + comment.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/comments/{id} allows author to delete comment and logs COMMENT_DELETED")
    void shouldAllowAuthorToDeleteComment() throws Exception {
        Comment comment = commentRepository.save(new Comment(testIssue, member, "Delete me please"));

        mockMvc.perform(delete("/api/comments/" + comment.getId())
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Comment deleted successfully"));

        assertThat(commentRepository.existsById(comment.getId())).isFalse();

        // Verify activity event
        mockMvc.perform(get("/api/issues/" + testIssue.getId() + "/activity")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventType").value(ActivityEventType.COMMENT_DELETED.name()));
    }

    @Test
    @DisplayName("DELETE /api/comments/{id} allows project OWNER to delete comment")
    void shouldAllowOwnerToDeleteMemberComment() throws Exception {
        Comment comment = commentRepository.save(new Comment(testIssue, member, "Rogue comment"));

        mockMvc.perform(delete("/api/comments/" + comment.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        assertThat(commentRepository.existsById(comment.getId())).isFalse();
    }
}
