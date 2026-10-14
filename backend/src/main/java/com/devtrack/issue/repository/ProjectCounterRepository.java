package com.devtrack.issue.repository;

import com.devtrack.issue.entity.ProjectCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectCounterRepository extends JpaRepository<ProjectCounter, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pc FROM ProjectCounter pc WHERE pc.projectId = :projectId")
    Optional<ProjectCounter> findByProjectIdForUpdate(@Param("projectId") Long projectId);
}
