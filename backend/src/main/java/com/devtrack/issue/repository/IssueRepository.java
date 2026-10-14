package com.devtrack.issue.repository;

import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.entity.IssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long>, JpaSpecificationExecutor<Issue> {

    Optional<Issue> findByProjectIdAndIssueNumber(Long projectId, Integer issueNumber);

    List<Issue> findByProjectId(Long projectId);

    Page<Issue> findAll(Specification<Issue> spec, Pageable pageable);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, IssueStatus status);

    long countByAssigneeIdAndStatusNot(Long assigneeId, IssueStatus status);

    long countByAssigneeIdAndDueDateBeforeAndStatusNot(Long assigneeId, LocalDate date, IssueStatus status);

    @Query("""
        SELECT i.status, COUNT(i)
        FROM Issue i
        WHERE i.project.id IN :projectIds
        GROUP BY i.status
        """)
    List<Object[]> countByStatusInProjectIds(@Param("projectIds") Collection<Long> projectIds);

    @Query("""
        SELECT i.priority, COUNT(i)
        FROM Issue i
        WHERE i.project.id IN :projectIds
        GROUP BY i.priority
        """)
    List<Object[]> countByPriorityInProjectIds(@Param("projectIds") Collection<Long> projectIds);

    @Query("""
        SELECT COUNT(i)
        FROM Issue i
        WHERE i.project.id IN :projectIds
        """)
    long countByProjectIds(@Param("projectIds") Collection<Long> projectIds);

    @Query("""
        SELECT COUNT(i)
        FROM Issue i
        WHERE i.project.id IN :projectIds
          AND i.assignee.id = :userId
          AND i.status != com.devtrack.issue.entity.IssueStatus.DONE
        """)
    long countOpenAssignedToUserInProjectIds(@Param("projectIds") Collection<Long> projectIds, @Param("userId") Long userId);

    @Query("""
        SELECT COUNT(i)
        FROM Issue i
        WHERE i.project.id IN :projectIds
          AND i.status != com.devtrack.issue.entity.IssueStatus.DONE
          AND i.dueDate < :today
        """)
    long countOverdueInProjectIds(@Param("projectIds") Collection<Long> projectIds, @Param("today") LocalDate today);

    @Query("""
        SELECT i.assignee.id, i.assignee.name, i.assignee.email,
               COUNT(i),
               SUM(CASE WHEN i.status != com.devtrack.issue.entity.IssueStatus.DONE THEN 1L ELSE 0L END),
               SUM(CASE WHEN i.status = com.devtrack.issue.entity.IssueStatus.DONE THEN 1L ELSE 0L END)
        FROM Issue i
        WHERE i.project.id IN :projectIds AND i.assignee IS NOT NULL
        GROUP BY i.assignee.id, i.assignee.name, i.assignee.email
        """)
    List<Object[]> findWorkloadByAssigneeInProjectIds(@Param("projectIds") Collection<Long> projectIds);
}
