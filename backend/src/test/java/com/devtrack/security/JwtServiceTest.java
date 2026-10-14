package com.devtrack.security;

import com.devtrack.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", secret);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    @DisplayName("generateToken generates valid token with correct email and userId claims")
    void shouldGenerateValidToken() {
        User user = new User("Jane Doe", "jane@example.com", "hash");
        user.setId(42L);

        String token = jwtService.generateToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractEmail(token)).isEqualTo("jane@example.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.isTokenValid(token, "jane@example.com")).isTrue();
        assertThat(jwtService.isTokenValid(token, "other@example.com")).isFalse();
    }

    @Test
    @DisplayName("isTokenExpired detects expired tokens")
    void shouldDetectExpiredToken() {
        // Set expiration to negative value (already expired)
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", -1000L);
        User user = new User("Bob", "bob@example.com", "hash");
        user.setId(1L);

        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenExpired(token)).isTrue();
        assertThat(jwtService.isTokenValid(token, "bob@example.com")).isFalse();
    }
}
