package com.devtrack.dashboard;

import com.devtrack.activity.entity.ActivityEvent;
import com.devtrack.activity.entity.ActivityEventType;
import com.devtrack.activity.repository.ActivityEventRepository;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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

    private User alice;
    private User bob;
    private User charlie;
    private String aliceToken;
    private String bobToken;
    private String charlieToken;
    private Project projectAlpha;
    private Project projectBeta;

    @BeforeEach
    void setUp() {
        activityEventRepository.deleteAll();
        commentRepository.deleteAll();
        issueRepository.deleteAll();
        projectCounterRepository.deleteAll();
        projectMemberRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        alice = userRepository.save(new User("Alice Lead", "alice@example.com", "hash123"));
        bob = userRepository.save(new User("Bob Dev", "bob@example.com", "hash123"));
        charlie = userRepository.save(new User("Charlie Outsider", "charlie@example.com", "hash123"));

        aliceToken = jwtService.generateToken(alice);
        bobToken = jwtService.generateToken(bob);
        charlieToken = jwtService.generateToken(charlie);

        projectAlpha = projectRepository.save(new Project("Project Alpha", "ALP", "Alpha desc", alice));
        projectMemberRepository.save(new ProjectMember(projectAlpha, alice, ProjectRole.OWNER));
        projectMemberRepository.save(new ProjectMember(projectAlpha, bob, ProjectRole.MEMBER));

        projectBeta = projectRepository.save(new Project("Project Beta", "BET", "Beta desc", alice));
        projectMemberRepository.save(new ProjectMember(projectBeta, alice, ProjectRole.OWNER));
        // Bob is not a member of projectBeta

        // Issues in Alpha:
        // 1. TODO, HIGH, assigned to Bob, not overdue
        Issue issue1 = issueRepository.save(new Issue(
                projectAlpha, 1, "Alpha Task 1", "desc", IssueType.TASK, IssueStatus.TODO, IssuePriority.HIGH,
                alice, bob, LocalDate.now().plusDays(5)
        ));
        // 2. IN_PROGRESS, URGENT, assigned to Bob, overdue (yesterday)
        Issue issue2 = issueRepository.save(new Issue(
                projectAlpha, 2, "Alpha Bug 2", "desc", IssueType.BUG, IssueStatus.IN_PROGRESS, IssuePriority.URGENT,
                alice, bob, LocalDate.now().minusDays(1)
        ));
        // 3. DONE, LOW, assigned to Bob
        Issue issue3 = issueRepository.save(new Issue(
                projectAlpha, 3, "Alpha Task 3", "desc", IssueType.TASK, IssueStatus.DONE, IssuePriority.LOW,
                bob, bob, null
        ));

        // Issues in Beta (Alice only):
        // 4. TODO, MEDIUM, assigned to Alice
        Issue issue4 = issueRepository.save(new Issue(
                projectBeta, 1, "Beta Task 1", "desc", IssueType.TASK, IssueStatus.TODO, IssuePriority.MEDIUM,
                alice, alice, null
        ));

        // Record some activity events
        activityEventRepository.save(new ActivityEvent(issue1, alice, ActivityEventType.ISSUE_CREATED, "Created issue ALP-1"));
        activityEventRepository.save(new ActivityEvent(issue2, alice, ActivityEventType.STATUS_CHANGED, "Changed status to IN_PROGRESS"));
        activityEventRepository.save(new ActivityEvent(issue4, alice, ActivityEventType.ISSUE_CREATED, "Created issue BET-1"));
    }

    @Test
    @DisplayName("GET /api/dashboard/summary calculates correct cross-project aggregates for member")
    void shouldReturnCorrectSummaryForMember() throws Exception {
        // Bob only has access to projectAlpha (3 issues total: 2 open assigned to him, 1 overdue, 1 TODO, 1 IN_PROGRESS, 1 DONE)
        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIssues").value(3))
                .andExpect(jsonPath("$.openIssuesAssignedToMe").value(2))
                .andExpect(jsonPath("$.overdueIssues").value(1))
                .andExpect(jsonPath("$.statusBreakdown.TODO").value(1))
                .andExpect(jsonPath("$.statusBreakdown.IN_PROGRESS").value(1))
                .andExpect(jsonPath("$.statusBreakdown.DONE").value(1))
                .andExpect(jsonPath("$.priorityBreakdown.HIGH").value(1))
                .andExpect(jsonPath("$.priorityBreakdown.URGENT").value(1))
                .andExpect(jsonPath("$.priorityBreakdown.LOW").value(1));
    }

    @Test
    @DisplayName("GET /api/dashboard/summary returns total across all accessible projects for Alice")
    void shouldReturnAllProjectsSummaryForAlice() throws Exception {
        // Alice has access to Alpha (3 issues) + Beta (1 issue) = 4 issues total
        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIssues").value(4))
                .andExpect(jsonPath("$.openIssuesAssignedToMe").value(1)) // only Beta Task 1 is assigned to Alice and open
                .andExpect(jsonPath("$.overdueIssues").value(1));
    }

    @Test
    @DisplayName("GET /api/dashboard/summary?projectId={id} scopes aggregates to single project")
    void shouldScopeSummaryToSingleProject() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary?projectId=" + projectBeta.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIssues").value(1))
                .andExpect(jsonPath("$.openIssuesAssignedToMe").value(1))
                .andExpect(jsonPath("$.overdueIssues").value(0))
                .andExpect(jsonPath("$.statusBreakdown.TODO").value(1));
    }

    @Test
    @DisplayName("GET /api/dashboard/summary?projectId={id} rejects outsider with 403")
    void shouldRejectOutsiderForProjectSummary() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary?projectId=" + projectBeta.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/dashboard/workload returns correct per-assignee open and done counts")
    void shouldReturnWorkloadBreakdown() throws Exception {
        mockMvc.perform(get("/api/dashboard/workload?projectId=" + projectAlpha.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Bob Dev"))
                .andExpect(jsonPath("$[0].totalAssigned").value(3))
                .andExpect(jsonPath("$[0].openCount").value(2))
                .andExpect(jsonPath("$[0].doneCount").value(1));
    }

    @Test
    @DisplayName("GET /api/dashboard/recent-activity filters to events visible in user's projects")
    void shouldReturnOnlyAccessibleRecentActivity() throws Exception {
        // Bob only has access to Alpha events (2 events), not Beta event
        mockMvc.perform(get("/api/dashboard/recent-activity?limit=10")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].issueKey").value("ALP-2"))
                .andExpect(jsonPath("$[1].issueKey").value("ALP-1"));
    }
}
