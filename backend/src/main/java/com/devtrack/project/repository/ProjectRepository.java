package com.devtrack.project.repository;

import com.devtrack.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectKey(String projectKey);
    boolean existsByProjectKey(String projectKey);

    @Query("SELECT DISTINCT p FROM Project p JOIN ProjectMember pm ON pm.project = p WHERE pm.user.id = :userId ORDER BY p.createdAt DESC")
    List<Project> findAllAccessibleByUserId(@Param("userId") Long userId);
}
