package com.devtrack.project.service;

import com.devtrack.common.exception.BadRequestException;
import com.devtrack.common.exception.ConflictException;
import com.devtrack.common.exception.ResourceNotFoundException;
import com.devtrack.project.dto.*;
import com.devtrack.project.entity.Project;
import com.devtrack.project.entity.ProjectMember;
import com.devtrack.project.entity.ProjectRole;
import com.devtrack.project.repository.ProjectMemberRepository;
import com.devtrack.project.repository.ProjectRepository;
import com.devtrack.security.SecurityUtils;
import com.devtrack.user.entity.User;
import com.devtrack.user.service.UserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserService userService;

    public ProjectService(
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            UserService userService
    ) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userService = userService;
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new AccessDeniedException("User is not authenticated"));
        return userService.findByEmail(email);
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        User currentUser = getCurrentUser();
        String normalizedKey = request.getProjectKey().trim().toUpperCase();

        if (projectRepository.existsByProjectKey(normalizedKey)) {
            throw new ConflictException("Project key already exists: " + normalizedKey);
        }

        Project project = new Project(
                request.getName().trim(),
                normalizedKey,
                request.getDescription() != null ? request.getDescription().trim() : null,
                currentUser
        );
        Project savedProject = projectRepository.save(project);

        // Creator is automatically registered as OWNER in project_members
        ProjectMember ownerMembership = new ProjectMember(savedProject, currentUser, ProjectRole.OWNER);
        projectMemberRepository.save(ownerMembership);

        return ProjectResponse.fromEntity(savedProject, ProjectRole.OWNER, 1);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAccessibleProjects() {
        User currentUser = getCurrentUser();
        List<Project> projects = projectRepository.findAllAccessibleByUserId(currentUser.getId());

        return projects.stream().map(project -> {
            ProjectRole role = getMemberRole(project.getId(), currentUser.getId());
            long memberCount = projectMemberRepository.countByProjectId(project.getId());
            return ProjectResponse.fromEntity(project, role, memberCount);
        }).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId) {
        User currentUser = getCurrentUser();
        Project project = findProjectEntity(projectId);
        ProjectRole role = getMemberRole(projectId, currentUser.getId());

        if (role == null) {
            throw new AccessDeniedException("You do not have access to this project");
        }

        long memberCount = projectMemberRepository.countByProjectId(projectId);
        return ProjectResponse.fromEntity(project, role, memberCount);
    }

    @Transactional
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request) {
        User currentUser = getCurrentUser();
        Project project = findProjectEntity(projectId);
        requireRole(projectId, currentUser.getId(), ProjectRole.OWNER);

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription().trim());
        }

        Project updatedProject = projectRepository.save(project);
        long memberCount = projectMemberRepository.countByProjectId(projectId);
        return ProjectResponse.fromEntity(updatedProject, ProjectRole.OWNER, memberCount);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(Long projectId) {
        User currentUser = getCurrentUser();
        requireMembership(projectId, currentUser.getId());

        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(ProjectMemberResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProjectMemberResponse addProjectMember(Long projectId, AddProjectMemberRequest request) {
        User currentUser = getCurrentUser();
        Project project = findProjectEntity(projectId);
        requireRole(projectId, currentUser.getId(), ProjectRole.OWNER);

        User targetUser = userService.findByEmail(request.getEmail().trim().toLowerCase());

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUser.getId())) {
            throw new ConflictException("User is already a member of this project");
        }

        ProjectMember newMember = new ProjectMember(
                project,
                targetUser,
                request.getRole() != null ? request.getRole() : ProjectRole.MEMBER
        );
        ProjectMember savedMember = projectMemberRepository.save(newMember);

        return ProjectMemberResponse.fromEntity(savedMember);
    }

    @Transactional
    public void removeProjectMember(Long projectId, Long targetUserId) {
        User currentUser = getCurrentUser();
        Project project = findProjectEntity(projectId);
        requireRole(projectId, currentUser.getId(), ProjectRole.OWNER);

        if (project.getOwner().getId().equals(targetUserId)) {
            throw new BadRequestException("Cannot remove the project owner from members");
        }

        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUserId)) {
            throw new ResourceNotFoundException("Member not found in project");
        }

        projectMemberRepository.deleteByProjectIdAndUserId(projectId, targetUserId);
    }

    @Transactional(readOnly = true)
    public Project findProjectEntity(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }

    @Transactional(readOnly = true)
    public void requireMembership(Long projectId, Long userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new AccessDeniedException("User is not a member of project " + projectId);
        }
    }

    @Transactional(readOnly = true)
    public void requireRole(Long projectId, Long userId, ProjectRole requiredRole) {
        ProjectRole role = getMemberRole(projectId, userId);
        if (role == null || role != requiredRole) {
            throw new AccessDeniedException("Requires " + requiredRole + " permission in project " + projectId);
        }
    }

    @Transactional(readOnly = true)
    public ProjectRole getMemberRole(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(ProjectMember::getRole)
                .orElse(null);
    }
}
