package com.devtrack.project;

import com.devtrack.project.dto.AddProjectMemberRequest;
import com.devtrack.project.dto.CreateProjectRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectIntegrationTest {

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
    private JwtService jwtService;

    private User owner;
    private User member;
    private User outsider;
    private String ownerToken;
    private String memberToken;
    private String outsiderToken;

    @BeforeEach
    void setUp() {
        projectMemberRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(new User("Alice Owner", "alice@example.com", "hash123"));
        member = userRepository.save(new User("Bob Member", "bob@example.com", "hash123"));
        outsider = userRepository.save(new User("Eve Outsider", "eve@example.com", "hash123"));

        ownerToken = jwtService.generateToken(owner);
        memberToken = jwtService.generateToken(member);
        outsiderToken = jwtService.generateToken(outsider);
    }

    @Test
    @DisplayName("POST /api/projects creates project and makes creator OWNER")
    void shouldCreateProjectSuccessfully() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("Web Portal", "WEB", "Main company website");

        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Web Portal"))
                .andExpect(jsonPath("$.projectKey").value("WEB"))
                .andExpect(jsonPath("$.currentUserRole").value("OWNER"))
                .andExpect(jsonPath("$.memberCount").value(1));
    }

    @Test
    @DisplayName("POST /api/projects rejects duplicate project key with 409 Conflict")
    void shouldRejectDuplicateProjectKey() throws Exception {
        CreateProjectRequest request1 = new CreateProjectRequest("Web Portal", "WEB", "Main website");
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        CreateProjectRequest request2 = new CreateProjectRequest("Another Web", "WEB", "Duplicate key");
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Project key already exists: WEB"));
    }

    @Test
    @DisplayName("GET /api/projects/{projectId} denies access to non-members with 403 Forbidden")
    void shouldDenyAccessToNonMembers() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("Secret Project", "SEC", "Internal only");
        String response = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long projectId = objectMapper.readTree(response).get("id").asLong();

        // Outsider attempts to read project
        mockMvc.perform(get("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("You do not have access to this project"));
    }

    @Test
    @DisplayName("Owner can add and remove members, but cannot remove project owner")
    void shouldManageProjectMembers() throws Exception {
        CreateProjectRequest createReq = new CreateProjectRequest("Team Project", "TEAM", "Collaboration space");
        String response = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long projectId = objectMapper.readTree(response).get("id").asLong();

        // Add Bob as MEMBER
        AddProjectMemberRequest addReq = new AddProjectMemberRequest("bob@example.com", ProjectRole.MEMBER);
        mockMvc.perform(post("/api/projects/" + projectId + "/members")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value("bob@example.com"))
                .andExpect(jsonPath("$.role").value("MEMBER"));

        // Bob can now access the project
        mockMvc.perform(get("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentUserRole").value("MEMBER"))
                .andExpect(jsonPath("$.memberCount").value(2));

        // Member cannot add other members (requires OWNER)
        AddProjectMemberRequest forbiddenAdd = new AddProjectMemberRequest("eve@example.com", ProjectRole.MEMBER);
        mockMvc.perform(post("/api/projects/" + projectId + "/members")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forbiddenAdd)))
                .andExpect(status().isForbidden());

        // Attempt to remove owner -> should fail with 400 Bad Request
        mockMvc.perform(delete("/api/projects/" + projectId + "/members/" + owner.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot remove the project owner from members"));

        // Remove Bob
        mockMvc.perform(delete("/api/projects/" + projectId + "/members/" + member.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        // Bob can no longer access
        mockMvc.perform(get("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden());
    }
}
