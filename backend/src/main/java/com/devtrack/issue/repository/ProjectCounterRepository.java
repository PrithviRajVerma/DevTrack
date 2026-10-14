package com.devtrack.issue.repository;

import com.devtrack.issue.entity.ProjectCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectCounterRepository extends JpaRepository<ProjectCounter, Long> {

    @Query(value = """
        INSERT INTO project_counters (project_id, last_issue_number)
        VALUES (:projectId, 1)
        ON CONFLICT (project_id)
        DO UPDATE SET last_issue_number = project_counters.last_issue_number + 1
        RETURNING last_issue_number
        """, nativeQuery = true)
    int getNextIssueNumber(@Param("projectId") Long projectId);
}
