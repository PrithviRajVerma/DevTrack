package com.devtrack.project.repository;

import com.devtrack.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectId(Long projectId);
    List<ProjectMember> findByUserId(Long userId);
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
    long countByProjectId(Long projectId);
    void deleteByProjectIdAndUserId(Long projectId, Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId")
    List<Long> findProjectIdsByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
