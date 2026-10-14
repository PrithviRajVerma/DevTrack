package com.devtrack.issue.repository;

import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.entity.IssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
}
