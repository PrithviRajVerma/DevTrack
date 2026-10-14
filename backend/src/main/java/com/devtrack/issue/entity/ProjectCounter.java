package com.devtrack.issue.entity;

import com.devtrack.project.entity.Project;
import jakarta.persistence.*;

@Entity
@Table(name = "project_counters")
public class ProjectCounter {

    @Id
    @Column(name = "project_id")
    private Long projectId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "last_issue_number", nullable = false)
    private Integer lastIssueNumber = 0;

    public ProjectCounter() {
    }

    public ProjectCounter(Project project) {
        this.project = project;
        this.projectId = project.getId();
        this.lastIssueNumber = 0;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Integer getLastIssueNumber() {
        return lastIssueNumber;
    }

    public void setLastIssueNumber(Integer lastIssueNumber) {
        this.lastIssueNumber = lastIssueNumber;
    }

    public int incrementAndGet() {
        this.lastIssueNumber++;
        return this.lastIssueNumber;
    }
}
