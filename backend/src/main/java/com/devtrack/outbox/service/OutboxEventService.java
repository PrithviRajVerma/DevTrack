package com.devtrack.outbox.service;

import com.devtrack.outbox.dto.OutboxPayload;
import com.devtrack.outbox.entity.OutboxEvent;
import com.devtrack.outbox.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutboxEventService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public OutboxEventService(OutboxEventRepository outboxEventRepository, ObjectMapper objectMapper) {
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public OutboxEvent publishEvent(
            String aggregateType,
            Long aggregateId,
            String eventType,
            OutboxPayload payload
    ) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            OutboxEvent event = new OutboxEvent(aggregateType, aggregateId, eventType, jsonPayload);
            return outboxEventRepository.save(event);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize outbox event payload", e);
        }
    }
}
