package com.devtrack.dashboard.dto;

public record AssigneeWorkloadResponse(
        Long userId,
        String name,
        String email,
        long totalAssigned,
        long openCount,
        long doneCount
) {}
