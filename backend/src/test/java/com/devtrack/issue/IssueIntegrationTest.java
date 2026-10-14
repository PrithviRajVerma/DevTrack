package com.devtrack.issue;

import com.devtrack.issue.dto.CreateIssueRequest;
import com.devtrack.issue.dto.UpdateIssueRequest;
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
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IssueIntegrationTest {

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
    private JwtService jwtService;

    private User owner;
    private User member;
    private User outsider;
    private String ownerToken;
    private String memberToken;
    private String outsiderToken;
    private Project project;

    @BeforeEach
    void setUp() {
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
    }

    @Test
    @DisplayName("POST /api/projects/{id}/issues creates issues with strictly sequential keys (CORE-1, CORE-2)")
    void shouldCreateIssuesWithSequentialKeys() throws Exception {
        CreateIssueRequest req1 = new CreateIssueRequest(
                "First Issue", "First description", IssueType.FEATURE, IssueStatus.TODO, IssuePriority.HIGH, null, null
        );

        mockMvc.perform(post("/api/projects/" + project.getId() + "/issues")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.issueNumber").value(1))
                .andExpect(jsonPath("$.key").value("CORE-1"))
                .andExpect(jsonPath("$.title").value("First Issue"))
                .andExpect(jsonPath("$.version").value(0));

        CreateIssueRequest req2 = new CreateIssueRequest(
                "Second Issue", "Second description", IssueType.BUG, IssueStatus.IN_PROGRESS, IssuePriority.URGENT, member.getId(), null
        );

        mockMvc.perform(post("/api/projects/" + project.getId() + "/issues")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.issueNumber").value(2))
                .andExpect(jsonPath("$.key").value("CORE-2"))
                .andExpect(jsonPath("$.assignee.email").value("bob@example.com"));
    }

    @Test
    @DisplayName("PATCH /api/issues/{id} detects optimistic locking collision and returns 409 Conflict")
    void shouldDetectOptimisticLockingCollision() throws Exception {
        CreateIssueRequest createReq = new CreateIssueRequest(
                "Concurrent Test Issue", "Initial desc", IssueType.TASK, IssueStatus.TODO, IssuePriority.MEDIUM, null, null
        );

        MvcResult createResult = mockMvc.perform(post("/api/projects/" + project.getId() + "/issues")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long issueId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // User A updates issue successfully with version 0
        UpdateIssueRequest updateA = new UpdateIssueRequest(
                "Updated by User A", "Desc A", IssueType.TASK, IssueStatus.IN_PROGRESS, IssuePriority.HIGH, null, null, 0
        );

        mockMvc.perform(patch("/api/issues/" + issueId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.title").value("Updated by User A"));

        // User B attempts to update with stale version 0 -> MUST receive 409 Conflict
        UpdateIssueRequest updateB = new UpdateIssueRequest(
                "Updated by User B", "Desc B", IssueType.TASK, IssueStatus.DONE, IssuePriority.LOW, null, null, 0
        );

        mockMvc.perform(patch("/api/issues/" + issueId)
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateB)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Issue has been updated by another user. Current version: 1, provided version: 0"));
    }

    @Test
    @DisplayName("GET /api/projects/{id}/issues filters correctly by status and priority")
    void shouldFilterIssues() throws Exception {
        CreateIssueRequest req1 = new CreateIssueRequest("Issue 1", "desc", IssueType.TASK, IssueStatus.TODO, IssuePriority.LOW, null, null);
        CreateIssueRequest req2 = new CreateIssueRequest("Issue 2", "desc", IssueType.BUG, IssueStatus.IN_PROGRESS, IssuePriority.HIGH, null, null);
        CreateIssueRequest req3 = new CreateIssueRequest("Issue 3", "desc", IssueType.FEATURE, IssueStatus.IN_PROGRESS, IssuePriority.LOW, null, null);

        for (CreateIssueRequest req : new CreateIssueRequest[]{req1, req2, req3}) {
            mockMvc.perform(post("/api/projects/" + project.getId() + "/issues")
                            .header("Authorization", "Bearer " + ownerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated());
        }

        // Filter by IN_PROGRESS
        mockMvc.perform(get("/api/projects/" + project.getId() + "/issues?status=IN_PROGRESS")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.content[1].status").value("IN_PROGRESS"));

        // Filter by HIGH priority
        mockMvc.perform(get("/api/projects/" + project.getId() + "/issues?priority=HIGH")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Issue 2"));
    }

    @Test
    @DisplayName("Creating issue rejects assigning a user who is not a project member")
    void shouldRejectNonMemberAssignee() throws Exception {
        CreateIssueRequest req = new CreateIssueRequest(
                "Invalid Assignment", "desc", IssueType.TASK, IssueStatus.TODO, IssuePriority.MEDIUM, outsider.getId(), null
        );

        mockMvc.perform(post("/api/projects/" + project.getId() + "/issues")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("User is not a member of project " + project.getId()));
    }

    @Test
    @DisplayName("Outsider is denied access to project issues with 403 Forbidden")
    void shouldDenyOutsiderAccessToIssues() throws Exception {
        mockMvc.perform(get("/api/projects/" + project.getId() + "/issues")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/issues/{id} allows reporter or owner, rejects unauthorized member")
    void shouldEnforceDeletePermissions() throws Exception {
        CreateIssueRequest createReq = new CreateIssueRequest(
                "Delete Test", "desc", IssueType.TASK, IssueStatus.TODO, IssuePriority.LOW, null, null
        );

        MvcResult createResult = mockMvc.perform(post("/api/projects/" + project.getId() + "/issues")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long issueId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Bob (regular member, not reporter, not owner) cannot delete
        mockMvc.perform(delete("/api/issues/" + issueId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only the issue reporter or project owner can delete an issue"));

        // Alice (owner and reporter) can delete
        mockMvc.perform(delete("/api/issues/" + issueId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Issue deleted successfully"));

        // Issue no longer exists
        mockMvc.perform(get("/api/issues/" + issueId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound());
    }
}
