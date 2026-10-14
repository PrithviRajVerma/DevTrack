package com.devtrack.activity.repository;

import com.devtrack.activity.entity.ActivityEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityEventRepository extends JpaRepository<ActivityEvent, Long> {

    List<ActivityEvent> findByIssueIdOrderByCreatedAtDesc(Long issueId);

    @Query("""
        SELECT ae FROM ActivityEvent ae
        JOIN ae.issue i
        JOIN i.project p
        JOIN ProjectMember pm ON pm.project = p
        WHERE pm.user.id = :userId
        ORDER BY ae.createdAt DESC
        """)
    List<ActivityEvent> findRecentActivityForUser(@Param("userId") Long userId, Pageable pageable);
}
