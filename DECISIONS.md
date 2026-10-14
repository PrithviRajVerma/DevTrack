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
