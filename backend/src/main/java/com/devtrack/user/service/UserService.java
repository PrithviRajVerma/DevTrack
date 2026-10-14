package com.devtrack.user.service;

import com.devtrack.common.exception.ResourceNotFoundException;
import com.devtrack.security.SecurityUtils;
import com.devtrack.user.dto.UserResponse;
import com.devtrack.user.entity.User;
import com.devtrack.user.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(Long id) {
        User user = findById(id);
        return UserResponse.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new AccessDeniedException("User is not authenticated"));
        User user = findByEmail(email);
        return UserResponse.fromEntity(user);
    }
}
