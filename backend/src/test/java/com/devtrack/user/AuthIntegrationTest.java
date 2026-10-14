package com.devtrack.user;

import com.devtrack.user.dto.AuthResponse;
import com.devtrack.user.dto.LoginRequest;
import com.devtrack.user.dto.RegisterRequest;
import com.devtrack.user.entity.User;
import com.devtrack.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/auth/register successfully creates user and sets auth cookie")
    void shouldRegisterUserSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("Sarah Connor", "sarah@cyberdyne.com", "JudgmentDay2026!");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.name").value("Sarah Connor"))
                .andExpect(jsonPath("$.user.email").value("sarah@cyberdyne.com"))
                .andReturn();

        String setCookieHeader = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookieHeader).contains("devtrack_token=");
        assertThat(setCookieHeader).contains("HttpOnly");

        // Verify database persistence and password hashing
        User savedUser = userRepository.findByEmail("sarah@cyberdyne.com").orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getName()).isEqualTo("Sarah Connor");
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("JudgmentDay2026!");
        assertThat(passwordEncoder.matches("JudgmentDay2026!", savedUser.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("POST /api/auth/register returns 409 Conflict when email already exists")
    void shouldRejectDuplicateEmail() throws Exception {
        RegisterRequest initialRequest = new RegisterRequest("John Doe", "john@example.com", "Password123!");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialRequest)))
                .andExpect(status().isCreated());

        // Try registering with same email in upper case
        RegisterRequest duplicateRequest = new RegisterRequest("Johnny", "JOHN@EXAMPLE.COM", "AnotherPass123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Email is already registered: john@example.com"))
                .andExpect(jsonPath("$.path").value("/api/auth/register"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 Bad Request when validation fails")
    void shouldRejectInvalidRegistrationInput() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest("", "not-an-email", "short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/api/auth/register"));
    }

    @Test
    @DisplayName("POST /api/auth/login authenticates user and sets cookie")
    void shouldLoginSuccessfully() throws Exception {
        // Register first
        RegisterRequest registerReq = new RegisterRequest("Kyle Reese", "kyle@resistance.org", "TechCom1984!");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login with matching credentials
        LoginRequest loginReq = new LoginRequest("KYLE@resistance.org", "TechCom1984!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("kyle@resistance.org"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 401 Unauthorized for incorrect password")
    void shouldRejectInvalidPassword() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("Kyle Reese", "kyle@resistance.org", "TechCom1984!");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("kyle@resistance.org", "WrongPassword!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("GET /api/users/me returns authenticated user profile")
    void shouldGetProfileWhenAuthenticated() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("Kyle Reese", "kyle@resistance.org", "TechCom1984!");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + authResponse.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Kyle Reese"))
                .andExpect(jsonPath("$.email").value("kyle@resistance.org"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @DisplayName("GET /api/users/me returns 401 Unauthorized when unauthenticated")
    void shouldRejectUnauthenticatedProfileAccess() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Full authentication is required to access this resource"))
                .andExpect(jsonPath("$.path").value("/api/users/me"));
    }

    @Test
    @DisplayName("POST /api/auth/logout clears auth cookie")
    void shouldClearCookieOnLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }
}
