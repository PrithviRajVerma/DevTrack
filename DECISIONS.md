# DevTrack Architecture & Design Decision Records (ADR)

This document records key architectural, engineering, and product decisions made throughout the lifecycle of DevTrack, including the context, rationale, alternatives considered, and consequences.

---

## Decision Index

| ID | Title | Date | Status | Scope |
|---|---|---|---|---|
| [ADR-001](#adr-001-modular-monolith-over-microservices) | Modular Monolith Architecture | 2026-10-14 | Accepted | Architecture |
| [ADR-002](#adr-002-dual-authentication-strategy-httponly-cookie--bearer-token) | Dual Authentication Strategy (HttpOnly Cookie + Bearer Fallback) | 2026-10-14 | Accepted | Security |
| [ADR-003](#adr-003-flyway-for-database-migrations-with-strict-constraints) | Database Migrations via Flyway & Strict Schema Constraints | 2026-10-14 | Accepted | Database |
| [ADR-004](#adr-004-standardized-api-error-contract-and-exception-hierarchy) | Standardized API Error Contract & Exception Hierarchy | 2026-10-14 | Accepted | API / Backend |
| [ADR-005](#adr-005-optimistic-locking-via-jpa-version-for-issue-updates) | Optimistic Locking via JPA `@Version` for Issue Updates | 2026-10-14 | Accepted | Concurrency |
| [ADR-006](#adr-006-atomic-project-scoped-issue-number-allocation) | Atomic Project-Scoped Issue Number Allocation | 2026-10-14 | Accepted | Concurrency / Database |
| [ADR-007](#adr-007-native-postgresql-upsert-returning-for-atomic-counters) | Native PostgreSQL Upsert with RETURNING for Sequence Counters | 2026-10-14 | Accepted | Performance / DB |
| [ADR-008](#adr-008-append-only-activity-audit-trail-with-mandatory-transaction-propagation) | Append-Only Activity Audit Trail with Mandatory Transaction Propagation | 2026-10-14 | Accepted | Architecture / Audit |
| [ADR-009](#adr-009-server-side-database-aggregation-for-analytics-dashboard) | Server-Side Database Aggregation for Analytics Dashboard | 2026-10-14 | Accepted | Performance / API |
| [ADR-010](#adr-010-bounded-threadpooltaskexecutor-with-explicit-backpressure) | Bounded ThreadPoolTaskExecutor with Explicit Backpressure | 2026-10-14 | Accepted | Concurrency |
| [ADR-011](#adr-011-transactional-outbox-pattern-with-skip-locked-polling) | Transactional Outbox Pattern with PostgreSQL SKIP LOCKED Polling | 2026-10-14 | Accepted | Reliability / Events |

---

## Detailed Records

### ADR-001: Modular Monolith Over Microservices
- **Context:** The application requirements include user management, projects, issues, comments, activity logs, notifications, and analytics dashboard.
- **Decision:** Build DevTrack as a modular monolith within a single Spring Boot application and single PostgreSQL database, using clean package boundaries by feature domain (`user`, `project`, `issue`, `comment`, `activity`, `notification`, `dashboard`).
- **Rationale:**
  - Avoids distributed transaction overhead, eventual consistency complexities, and network serialization costs.
  - Allows atomic transactional boundaries when creating issues and recording audit/outbox events.
  - Matches the deployment scale of small-to-medium software teams.
- **Alternatives Considered:** Microservices split (User Service, Project Service, Issue Service, Notification Service). Rejected due to operational complexity and unnecessary latency.
- **Consequences:** Code modularity must be strictly maintained; cross-domain dependencies should pass through services/DTOs rather than tangled entity graphs.

---

### ADR-002: Dual Authentication Strategy (HttpOnly Cookie + Bearer Token)
- **Context:** Browser single-page applications (SPAs) are vulnerable to Cross-Site Scripting (XSS) if access tokens are stored in `localStorage` or `sessionStorage`. Conversely, automated integration tests and REST API clients need simple token passing.
- **Decision:** Issue signed HMAC-SHA256 JWTs upon login and registration. Return the token in both:
  1. A secure `HttpOnly`, `SameSite=Lax`, `Path=/` cookie (`devtrack_token`) for browsers.
  2. The response body JSON for programmatic API clients and automated tests.
  `JwtAuthenticationFilter` checks `Authorization: Bearer <token>` first, and falls back to the `devtrack_token` cookie.
- **Rationale:**
  - Prevents JavaScript execution from reading tokens in browser contexts (mitigates XSS token theft).
  - Maintains first-class developer experience for CLI/cURL, Swagger UI, and automated test suites.
- **Consequences:** Requires appropriate CORS origin whitelist and credentials configuration on both frontend and backend.

---

### ADR-003: Flyway for Database Migrations with Strict Schema Constraints
- **Context:** Hibernate `ddl-auto: update` or `create-drop` is non-deterministic and dangerous in production.
- **Decision:** Use Flyway migrations (`V1__...`, `V2__...`, etc.) as the single source of truth for database DDL. Set Hibernate's `ddl-auto` to `validate`.
- **Rationale:**
  - Full version control of database changes across environments and developer workstations.
  - Explicit control over indexes, foreign keys, unique constraints, and cascade delete policies.
- **Consequences:** Every schema change must be accompanied by an incremental migration SQL script.

---

### ADR-004: Standardized API Error Contract and Exception Hierarchy
- **Context:** Default Spring Boot errors expose varying shapes and internal implementation details or stack traces on errors.
- **Decision:** Define a custom `ApiException` hierarchy (`BadRequestException`, `ConflictException`, `ResourceNotFoundException`) mapped by `@RestControllerAdvice` to a uniform JSON payload:
  ```json
  {
    "timestamp": "ISO-8601",
    "status": 400,
    "error": "Bad Request",
    "message": "Human-readable description",
    "path": "/api/resource"
  }
  ```
- **Rationale:**
  - Provides reliable error parsing for client applications and consistent frontend alerts.
  - Prevents security leaks (stack traces or internal server details).
- **Consequences:** Controllers and services throw descriptive domain exceptions instead of returning error codes manually.

---

### ADR-005: Optimistic Locking via JPA `@Version` for Issue Updates
- **Context:** Multiple team members may edit the same issue simultaneously (e.g. status changes, title edits). Silent last-write-wins overwrites cause data loss.
- **Decision:** Include an integer `version` column in the `issues` table and map it with `@Version` on the JPA `Issue` entity. When a stale version is updated, catch `OptimisticLockingFailureException` and map to HTTP `409 Conflict`.
- **Rationale:**
  - Low database overhead compared to pessimistic table/row locks.
  - Safe, predictable concurrent collaboration.
- **Consequences:** The client must provide the known `version` in update payloads or handle conflict retries gracefully.

---

### ADR-006: Atomic Project-Scoped Issue Number Allocation
- **Context:** Issues have human-readable identifiers per project (e.g. `WEB-1`, `WEB-2`). Under high concurrent creation requests, naive `MAX(issue_number) + 1` causes race conditions and duplicate key errors.
- **Decision:** Enforce composite uniqueness on `(project_id, issue_number)` in PostgreSQL. Allocate issue numbers atomically using either a project-level locked counter query or a sequence table within an isolated transaction.
- **Rationale:**
  - Guarantees sequential, gapless-where-possible issue keys without race conditions.
  - Schema-level constraint prevents corrupted data under concurrency.
- **Consequences:** Creation transactions briefly synchronize on the project's sequence counter.


### ADR-007: Native PostgreSQL Upsert with RETURNING for Sequence Counters
- **Context:** Entity-level JPA updates for `ProjectCounter` with assigned keys triggered Hibernate `merge()` semantics and optimistic locking failures on concurrent inserts.
- **Decision:** Use a single atomic native SQL query with PostgreSQL's `INSERT INTO project_counters (project_id, last_issue_number) VALUES (:projectId, 1) ON CONFLICT (project_id) DO UPDATE SET last_issue_number = project_counters.last_issue_number + 1 RETURNING last_issue_number`.
- **Rationale:**
  - Completely atomic in the database engine without application-level distributed or table locks.
  - Zero ORM dirty-checking or merge-state overhead.
  - Guaranteed monotonically increasing, unique issue keys per project under concurrent threads.
- **Consequences:** Relies on PostgreSQL-specific dialect features, which matches the project specification.

---

### ADR-008: Append-Only Activity Audit Trail with Mandatory Transaction Propagation
- **Context:** Traceability requires tracking who performed mutations on issues (creation, status change, priority changes, reassignment, and comments) without corrupting history or allowing audit events to be written if the primary entity operation rolls back.
- **Decision:** Model `activity_events` as an append-only table without update or delete endpoints. Service recording methods enforce `@Transactional(propagation = Propagation.MANDATORY)`.
- **Rationale:**
  - Guarantees that audit records only commit if the underlying business transaction succeeds.
  - Prevents orphan audit entries on rollbacks and ensures atomic consistency.
  - Append-only design eliminates audit tampering risks.
- **Consequences:** All callers of `activityEventService.recordEvent` must already be executing within an active transactional context.

---

### ADR-009: Server-Side Database Aggregation for Analytics Dashboard
- **Context:** The team dashboard requires issue totals, status breakdown, open assigned issues, overdue issues, and per-assignee workload breakdown. Fetching all issues to calculate counts in the browser would create massive bandwidth and memory waste as the dataset grows.
- **Decision:** Implement dedicated JPQL aggregation queries (`GROUP BY i.status`, `GROUP BY i.priority`, `GROUP BY i.assignee`, `SUM(CASE WHEN ... THEN 1 ELSE 0)`) in `IssueRepository` scoped strictly to the list of project IDs the current authenticated user belongs to.
- **Rationale:**
  - Moves computation to PostgreSQL which optimizes aggregate operations with index scans.
  - Eliminates over-fetching; the dashboard endpoint transfers small summarized JSON payloads instead of hundreds or thousands of issue entities.
  - Enforces project boundary security directly within the query predicate (`WHERE i.project.id IN :projectIds`).
- **Consequences:** Aggregate endpoints cannot be served directly from client caches without invalidation upon issue mutations. TanStack Query cache tags manage this effectively.

---

### ADR-010: Bounded ThreadPoolTaskExecutor with Explicit Backpressure
- **Context:** Background notification processing and async event delivery require worker threads. Using unbounded queues (`LinkedBlockingQueue()` with default Integer.MAX_VALUE) or unbounded thread creation risks catastrophic OutOfMemoryError (OOM) or thread exhaustion under sudden burst traffic.
- **Decision:** Configure a dedicated Spring `ThreadPoolTaskExecutor` bean (`notificationTaskExecutor`) with `corePoolSize = 4`, `maxPoolSize = 8`, bounded `queueCapacity = 50`, named thread factory (`devtrack-worker-%d`), graceful shutdown with 30s timeout, and a custom `RejectedExecutionHandler` that increments observability metrics and throws `RejectedExecutionException`.
- **Rationale:**
  - Prevents unbounded memory growth during load spikes by capping total pending background tasks at 58 (8 active + 50 queued).
  - Explicit backpressure signals to callers that system capacity is reached rather than silently failing or degrading application latency.
  - Named threads simplify log correlation and profiling.
- **Consequences:** Upstream callers or polling workers must handle `RejectedExecutionException` gracefully by backing off and retrying in subsequent poll cycles.

---

### ADR-011: Transactional Outbox Pattern with PostgreSQL SKIP LOCKED Polling
- **Context:** In-app notifications must be created reliably when issues are assigned, statuses transition, or comments are added. Direct asynchronous dispatch inside the HTTP request transaction creates race conditions (asynchronous workers may attempt to read data before the primary transaction commits) or loses notifications if the process terminates mid-flight.
- **Decision:** Implement the Transactional Outbox Pattern. Insert events into `outbox_events` within the same database transaction as issue and comment changes. A background worker polls pending events using PostgreSQL's `SELECT ... FOR UPDATE SKIP LOCKED` query and dispatches them to the bounded thread pool executor.
- **Rationale:**
  - Guarantees at-least-once event delivery; notifications are never lost if the server restarts.
  - Decouples notification delivery and serialization from client-facing transaction response times.
  - `FOR UPDATE SKIP LOCKED` eliminates concurrency bottlenecks and prevents multiple workers from processing identical events.
  - Worker processing is idempotent: duplicate notification generation is guarded by unique recipient and message checks.
- **Consequences:** Notifications are delivered asynchronously (within ~1-2 seconds of state mutation) rather than synchronously in the same HTTP response.

---

### ADR-012: Multi-Stage Production Containerization and CI/CD Automation
- **Context:** Delivering a reproducible, production-grade deployment requires containerizing the modular monolith (Spring Boot backend, React Vite SPA frontend, PostgreSQL database) and establishing automated verification via continuous integration.
- **Decision:**
  1. Multi-stage Dockerfile for backend (`eclipse-temurin:21-jdk-alpine` builder stage, `eclipse-temurin:21-jre-alpine` runtime stage) running under an unprivileged system user (`devtrack:devtrack`) with Spring Boot Actuator liveness/readiness healthchecks.
  2. Multi-stage Dockerfile for frontend (`node:20-alpine` builder stage, `nginx:1.27-alpine` runtime stage) serving pre-compiled static bundles with gzip compression, security headers, SPA client-side routing fallback, and reverse-proxying `/api/` and `/actuator/` requests to the internal backend container.
  3. Production Docker Compose (`docker-compose.prod.yml`) orchestrating service healthcheck dependency chains (`condition: service_healthy`) and persistent volume mounts.
  4. GitHub Actions CI pipeline (`.github/workflows/ci.yml`) triggering on pushes and pull requests to run PostgreSQL service integration tests, Maven test suite, TypeScript verification, and container image build validation.
- **Rationale:**
  - Dramatically reduces production image size by discarding build tools (JDK, Maven, Node.js, source code) from final images.
  - Running as non-root mitigates container escape and privilege escalation vulnerabilities.
  - Reverse-proxying API requests through Nginx establishes a single origin, eliminating cross-origin cookie restrictions and CORS preflight overhead.
  - Automated CI ensures no untested code or broken builds reach main branches.
- **Consequences:** Local production testing requires Docker Engine and Docker Compose.



