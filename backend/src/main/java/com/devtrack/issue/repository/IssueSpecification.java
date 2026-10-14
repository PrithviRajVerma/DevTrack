package com.devtrack.issue.repository;

import com.devtrack.issue.entity.Issue;
import com.devtrack.issue.entity.IssuePriority;
import com.devtrack.issue.entity.IssueStatus;
import com.devtrack.issue.entity.IssueType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class IssueSpecification {

    public static Specification<Issue> withFilters(
            Long projectId,
            IssueStatus status,
            IssuePriority priority,
            IssueType type,
            Long assigneeId,
            Boolean overdue,
            String search
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always scope to project
            predicates.add(cb.equal(root.get("project").get("id"), projectId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }

            if (Boolean.TRUE.equals(overdue)) {
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDate.now()));
                predicates.add(cb.notEqual(root.get("status"), IssueStatus.DONE));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), searchPattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(titleLike, descLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
