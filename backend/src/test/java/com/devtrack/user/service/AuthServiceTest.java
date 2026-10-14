package com.devtrack.user.service;

import com.devtrack.common.exception.ConflictException;
import com.devtrack.security.JwtService;
import com.devtrack.user.dto.AuthResponse;
import com.devtrack.user.dto.LoginRequest;
import com.devtrack.user.dto.RegisterRequest;
import com.devtrack.user.entity.User;
import com.devtrack.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "cookieName", "devtrack_token");
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 3600000L);
    }

    @Test
    @DisplayName("register successfully encodes password, saves user, and returns AuthResponse")
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = new RegisterRequest("Alice Smith", "alice@example.com", "Password123!");

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("encodedHash123");

        User savedUser = new User("Alice Smith", "alice@example.com", "encodedHash123");
        savedUser.setId(10L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("mockedJwtToken");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mockedJwtToken");
        assertThat(response.getUser().getEmail()).isEqualTo("alice@example.com");
        assertThat(response.getUser().getName()).isEqualTo("Alice Smith");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register throws ConflictException when email is already registered")
    void shouldThrowConflictWhenEmailExists() {
        RegisterRequest request = new RegisterRequest("Alice Smith", "ALICE@EXAMPLE.COM", "Password123!");

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("login authenticates credentials and returns valid AuthResponse")
    void shouldLoginSuccessfully() {
        LoginRequest request = new LoginRequest("alice@example.com", "Password123!");
        User user = new User("Alice Smith", "alice@example.com", "encodedHash123");
        user.setId(10L);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("mockedJwtToken");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("mockedJwtToken");
        assertThat(response.getUser().getEmail()).isEqualTo("alice@example.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login throws BadCredentialsException when authentication fails")
    void shouldThrowBadCredentialsWhenAuthFails() {
        LoginRequest request = new LoginRequest("alice@example.com", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }
}
