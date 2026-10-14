package com.devtrack.config;

import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

@Component
public class ExecutorMetrics {

    private final AtomicLong rejectedTaskCount = new AtomicLong(0);
    private final AtomicLong failedTaskCount = new AtomicLong(0);
    private ThreadPoolTaskExecutor executor;

    public void setExecutor(ThreadPoolTaskExecutor executor) {
        this.executor = executor;
    }

    public void recordRejection() {
        rejectedTaskCount.incrementAndGet();
    }

    public void recordFailure() {
        failedTaskCount.incrementAndGet();
    }

    public int getQueueDepth() {
        return executor != null ? executor.getThreadPoolExecutor().getQueue().size() : 0;
    }

    public int getQueueRemainingCapacity() {
        return executor != null ? executor.getThreadPoolExecutor().getQueue().remainingCapacity() : 0;
    }

    public int getActiveCount() {
        return executor != null ? executor.getActiveCount() : 0;
    }

    public int getPoolSize() {
        return executor != null ? executor.getPoolSize() : 0;
    }

    public long getCompletedTaskCount() {
        return executor != null ? executor.getThreadPoolExecutor().getCompletedTaskCount() : 0;
    }

    public long getRejectedTaskCount() {
        return rejectedTaskCount.get();
    }

    public long getFailedTaskCount() {
        return failedTaskCount.get();
    }
}
