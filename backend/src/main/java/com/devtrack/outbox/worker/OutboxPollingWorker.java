package com.devtrack.outbox.worker;

import com.devtrack.outbox.entity.OutboxEvent;
import com.devtrack.outbox.repository.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.RejectedExecutionException;

@Component
public class OutboxPollingWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxPollingWorker.class);

    private final OutboxEventRepository outboxEventRepository;
    private final OutboxEventProcessor outboxEventProcessor;
    private final ThreadPoolTaskExecutor taskExecutor;

    public OutboxPollingWorker(
            OutboxEventRepository outboxEventRepository,
            OutboxEventProcessor outboxEventProcessor,
            @Qualifier("notificationTaskExecutor") ThreadPoolTaskExecutor taskExecutor
    ) {
        this.outboxEventRepository = outboxEventRepository;
        this.outboxEventProcessor = outboxEventProcessor;
        this.taskExecutor = taskExecutor;
    }

    @Scheduled(fixedDelayString = "${devtrack.outbox.poll-interval:2000}")
    @Transactional
    public void pollAndDispatch() {
        List<OutboxEvent> events = outboxEventRepository.claimPendingEventsForUpdate(20);
        if (events.isEmpty()) {
            return;
        }

        log.debug("Claimed {} pending outbox events for background processing", events.size());

        for (OutboxEvent event : events) {
            Long eventId = event.getId();
            try {
                taskExecutor.execute(() -> outboxEventProcessor.processEvent(eventId));
            } catch (RejectedExecutionException e) {
                log.warn("Backpressure triggered: could not dispatch event {} to worker pool: {}",
                        eventId, e.getMessage());
                break; // Stop claiming more when queue is full
            }
        }
    }

    /**
     * Direct synchronous drain for integration tests.
     */
    public void processAllPendingSynchronously() {
        List<OutboxEvent> events = outboxEventRepository.claimPendingEventsForUpdate(100);
        for (OutboxEvent event : events) {
            outboxEventProcessor.processEvent(event.getId());
        }
    }
}
