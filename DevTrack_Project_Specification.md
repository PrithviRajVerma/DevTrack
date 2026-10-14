# DevTrack — Full-Stack Issue Tracking & Team Collaboration Platform

> **Purpose:** Build a polished, production-minded portfolio project that demonstrates Java backend engineering, full-stack development, database design, authentication, testing, deployment, and practical multithreading.
>
> **Primary audience:** Recruiters and interviewers hiring Java backend or full-stack developers at startups and large companies.
>
> **Important:** Build working, testable features—not just mock screens. Do not claim performance numbers or completed functionality unless they have actually been measured or implemented.

---

## 1. Product Overview

DevTrack is a web application for small software teams to manage projects, issues, assignments, deadlines, comments, and notifications. It is inspired by common issue-tracking workflows, without attempting to reproduce every feature of Jira.

### Core user journey

1. A user registers and signs in.
2. The user creates a workspace/project and invites or adds teammates.
3. A project member creates an issue with a title, description, priority, type, and optional due date.
4. The issue is assigned to a team member and moved across a Kanban board.
5. Team members comment on the issue and view its activity history.
6. Relevant users receive in-app notifications.
7. A dashboard summarizes issue counts, overdue work, and team workload.

### Product principles

- Secure by default: every protected resource is authorized on the server.
- Reliable: validation, useful error responses, transactions, and automated tests.
- Concurrency-aware: background work uses bounded execution capacity and thread-safe state.
- Understandable: clear package boundaries, documented APIs, and a readable README.
- Usable: responsive layouts, loading states, empty states, and actionable error messages.

---

## 2. Technology Stack

Use stable, mutually compatible releases. Prefer current stable versions available when implementation begins; record exact versions in the project files.

### Backend

- Java 21 (or a newer LTS version if supported by the chosen dependencies)
- Spring Boot 3.x or a compatible current stable Spring Boot release
- Spring Web / Spring MVC
- Spring Security
- Spring Data JPA and Hibernate
- Jakarta Bean Validation
- PostgreSQL
- Flyway for database migrations
- Maven
- JUnit 5, Mockito, and Spring Boot Test
- springdoc-openapi for Swagger/OpenAPI documentation

### Frontend

- React
- TypeScript
- Vite
- React Router
- A consistent component library or custom CSS design system
- TanStack Query or an equivalent API-state/data-fetching solution
- A drag-and-drop library for the Kanban board, if needed

Choose one UI approach and use it consistently. Do not add dependencies without a clear purpose.

### Development and delivery

- Docker and Docker Compose
- GitHub Actions for CI
- Testcontainers for PostgreSQL integration tests, if practical
- A deployment platform for the frontend and backend
- Environment variables for secrets and environment-specific configuration

### Architecture

Start as a **modular monolith**: one Spring Boot application and one PostgreSQL database. Do not split it into microservices merely to make it look advanced.

---

## 3. Scope and Priorities

### Phase 1 — Essential MVP

- Registration and login
- Current-user profile endpoint
- Project creation and listing
- Project membership
- Issue create, read, update, delete (subject to permissions)
- Issue status, priority, type, assignee, and due date
- Pagination, filtering, and sorting
- Responsive frontend with protected routes
- PostgreSQL schema migrations
- Validation and consistent API errors
- Basic unit and integration tests

### Phase 2 — Team collaboration

- Issue comments
- Activity history for important issue changes
- In-app notifications
- Notification unread/read state
- Kanban board
- Dashboard metrics
- Search and useful filters

### Phase 3 — Concurrency and reliability

- Asynchronous notification delivery
- Bounded background executor
- Safe handling of concurrent updates
- Retry policy for transient background failures
- Graceful application shutdown
- Observability for queue depth, processing time, and failures
- Concurrency-focused tests and a repeatable benchmark

### Phase 4 — Portfolio polish

- OpenAPI/Swagger documentation
- Docker Compose local setup
- CI pipeline
- Demo data or a controlled demo account
- Deployment
- Screenshots and a concise architecture diagram
- Complete README, design decisions, and known limitations

Implement Phase 1 thoroughly before starting advanced features.

---

## 4. Functional Requirements

### 4.1 Accounts and authentication

Users should be able to register, sign in, sign out, and view their own profile.

Requirements:
- Validate email format and password rules.
- Normalize email addresses consistently and enforce uniqueness in the database.
- Hash passwords using a secure adaptive password encoder such as BCrypt or Argon2.
- Never store or log plain-text passwords.
- Protect private API routes.
- Return a useful `401 Unauthorized` response for unauthenticated requests.
- Return `403 Forbidden` when an authenticated user lacks permission.
- Provide a documented authentication strategy.

For a browser application, prefer secure, HttpOnly cookies with appropriate SameSite and CSRF protection, or document the trade-offs if using bearer tokens. Do not store long-lived sensitive tokens in local storage by default. Never put secrets in source control.

### 4.2 Projects and membership

A project has:
- ID
- Name
- Key (short identifier such as `WEB`)
- Description
- Owner
- Created and updated timestamps

Requirements:
- Create and list projects available to the current user.
- Add/remove members according to permissions.
- Enforce unique project keys.
- Only project members may view project-private information.
- Only authorized roles may modify project settings or membership.

Suggested roles:
- `OWNER`: manage project settings and membership.
- `MEMBER`: work on issues and comment.

Keep authorization checks in the backend. Hiding a button in the UI is not security.

### 4.3 Issues

Each issue should include:
- ID
- Project
- Human-readable key, e.g. `WEB-42`
- Title
- Description
- Type: `TASK`, `BUG`, `FEATURE`
- Status: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`
- Priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- Reporter
- Optional assignee
- Optional due date
- Created/updated timestamps
- Version field for optimistic locking

Requirements:
- Create, view, edit, and delete issues according to permissions.
- Assign only users who belong to the relevant project.
- Filter by status, priority, assignee, type, and overdue state.
- Support pagination and sorting on the server.
- Validate status and priority transitions.
- Prevent users from accessing issues in projects they do not belong to.
- Use a database transaction when an operation must update multiple related records.

### 4.4 Comments and activity

Comments:
- Members can add comments to issues.
- Comment authors can edit/delete their own comments, subject to a clearly defined policy.
- Comments must be validated and associated with the correct issue.

Activity history:
- Record important events such as issue creation, status changes, assignment changes, and priority changes.
- Include actor, action, issue, timestamp, and a concise description or structured before/after values.
- Treat activity entries as append-only in normal application workflows.

### 4.5 Notifications

Create in-app notifications for events such as:
- A user is assigned an issue.
- Someone comments on an issue the user is involved in.
- An issue assigned to the user changes status.
- A due date reminder is triggered, if scheduled reminders are implemented.

Each notification should have an ID, recipient, type, message, related issue, creation timestamp, and read timestamp or read flag.

Requirements:
- Users can list their own notifications, mark one as read, and mark all as read.
- Users must not read or update another user's notifications.
- Avoid duplicate notifications when practical.
- Keep notification creation and delivery behavior clearly separated.
- Start with in-app notifications. Email delivery is optional and must not block the core workflow.

### 4.6 Dashboard

Display:
- Total issues visible to the user
- Issues grouped by status
- Open issues assigned to the current user
- Overdue issues
- Recent activity
- Workload by assignee, for users authorized to see it

Use backend aggregate queries where appropriate. Avoid downloading every issue just to calculate simple totals in the browser.

### 4.7 Kanban board

- Display columns for issue statuses.
- Move issues between statuses through drag and drop.
- Persist changes through the API.
- Show loading and failure states.
- If an update fails, restore the prior UI state or refetch the authoritative state.
- Respect permissions and valid status transitions.

---

## 5. Backend Design

Use a layered structure with clear responsibilities:

- **Controller:** HTTP mapping, request/response DTOs, status codes.
- **Service:** business rules, authorization orchestration, transactions.
- **Repository:** persistence queries.
- **Entity:** database persistence model.
- **DTO:** explicit API input/output model; do not expose JPA entities directly.
- **Mapper:** convert between entities and DTOs, manually or with a suitable mapping library.
- **Configuration:** security, executors, API documentation, and application setup.
- **Exception handling:** consistent API error format.

Suggested package structure:

```text
backend/
  src/main/java/com/devtrack/
    DevTrackApplication.java
    config/
    security/
    common/
      exception/
      api/
    user/
      controller/
      service/
      repository/
      entity/
      dto/
    project/
      controller/
      service/
      repository/
      entity/
      dto/
    issue/
      controller/
      service/
      repository/
      entity/
      dto/
    comment/
    activity/
    notification/
    dashboard/
    job/
  src/main/resources/
    application.yml
    db/migration/
  src/test/java/com/devtrack/
```

Keep feature packages reasonably consistent. Do not create empty classes or excessive abstractions just to fill the structure.

### API response and error conventions

- Use appropriate HTTP status codes.
- Use request/response DTOs.
- Validate request bodies using Bean Validation.
- Use a global exception handler (`@RestControllerAdvice`).
- Return a consistent error shape, for example:

```json
{
  "timestamp": "2026-01-01T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Title must not be blank",
  "path": "/api/projects/1/issues"
}
```

The timestamp is an example, not a fixed value. Avoid returning stack traces or internal implementation details to clients.

---

## 6. Initial REST API Contract

Use `/api` as the base path. Names may be refined during implementation, but keep naming consistent and document all endpoints in OpenAPI.

### Authentication and users

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out, if applicable to chosen auth strategy |
| GET | `/api/users/me` | Current user's profile |

### Projects

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List accessible projects |
| GET | `/api/projects/{projectId}` | Project details |
| PATCH | `/api/projects/{projectId}` | Update project |
| GET | `/api/projects/{projectId}/members` | List members |
| POST | `/api/projects/{projectId}/members` | Add member |
| DELETE | `/api/projects/{projectId}/members/{userId}` | Remove member |

### Issues

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/projects/{projectId}/issues` | Create issue |
| GET | `/api/projects/{projectId}/issues` | List/filter issues |
| GET | `/api/issues/{issueId}` | Issue details |
| PATCH | `/api/issues/{issueId}` | Update issue |
| DELETE | `/api/issues/{issueId}` | Delete issue, subject to policy |
| GET | `/api/issues/{issueId}/activity` | Activity history |

List endpoints should support `page`, `size`, and allowed sort fields. Issue lists should support relevant filters such as `status`, `priority`, `assigneeId`, `type`, and `overdue`.

### Comments and notifications

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/issues/{issueId}/comments` | List comments |
| POST | `/api/issues/{issueId}/comments` | Add comment |
| PATCH | `/api/comments/{commentId}` | Edit own comment |
| DELETE | `/api/comments/{commentId}` | Delete own comment |
| GET | `/api/notifications` | List current user's notifications |
| PATCH | `/api/notifications/{notificationId}/read` | Mark notification read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/summary` | Summary counts |
| GET | `/api/dashboard/workload` | Workload data |
| GET | `/api/dashboard/recent-activity` | Recent events |

Return sensible validation errors for malformed query parameters and unsupported sort fields.

---

## 7. Database Design

Use PostgreSQL and Flyway migrations. Design foreign keys, unique constraints, indexes, and deletion rules intentionally.

Suggested tables:

### `users`
- `id` (primary key)
- `name`
- `email` (unique)
- `password_hash`
- `created_at`
- `updated_at`

### `projects`
- `id`
- `name`
- `project_key` (unique)
- `description`
- `owner_id` (foreign key to users)
- `created_at`
- `updated_at`

### `project_members`
- `project_id`
- `user_id`
- `role`
- `joined_at`
- Unique constraint on `(project_id, user_id)`

### `issues`
- `id`
- `project_id`
- `issue_number`
- `title`
- `description`
- `type`
- `status`
- `priority`
- `reporter_id`
- Nullable `assignee_id`
- Nullable `due_date`
- `version` for optimistic locking
- `created_at`
- `updated_at`

Use a unique constraint on `(project_id, issue_number)` to generate issue keys safely under concurrent creation.

### `comments`
- `id`
- `issue_id`
- `author_id`
- `body`
- `created_at`
- `updated_at`

### `activity_events`
- `id`
- `issue_id`
- `actor_id`
- `event_type`
- `details` (structured JSON or well-defined columns)
- `created_at`

### `notifications`
- `id`
- `recipient_id`
- `type`
- `message`
- Nullable `issue_id`
- `created_at`
- `read_at`

### Optional `background_jobs`
Only add a persisted job table if implementing durable/recoverable background work. Include fields such as type, payload, status, attempts, next-run time, created/updated timestamps, and last error. Never store secrets in job payloads or logs.

Potential indexes:
- `issues(project_id, status)`
- `issues(assignee_id, status)`
- `issues(project_id, priority)`
- `comments(issue_id, created_at)`
- `activity_events(issue_id, created_at)`
- `notifications(recipient_id, read_at, created_at)`

Add indexes based on actual query patterns. Avoid adding every conceivable index.

---

## 8. Multithreading and Concurrency Requirements

Concurrency must solve actual problems in the application. Do not create threads for ordinary CRUD requests without a reason.

### 8.1 Background notification processing

Use an explicitly configured `ThreadPoolExecutor` or a Spring-managed executor with:
- A bounded queue
- A configurable number of worker threads
- A named thread factory
- A deliberate rejection/backpressure policy
- Graceful shutdown and a documented shutdown timeout
- Metrics for queue depth, completed tasks, failures, and processing duration

Do not use an unbounded queue, an unlimited number of threads, or `CallerRunsPolicy` without understanding its consequences. Choose and document a policy appropriate to the workload.

### 8.2 Transaction boundaries

- Do not assume a database transaction automatically includes asynchronous work.
- Do not pass managed JPA entities or lazy proxies into background threads.
- Pass immutable identifiers or event DTOs to background tasks.
- Fetch data in the thread that needs it, within a suitable transaction.
- Do not use `parallelStream()` as a substitute for a deliberate executor design.

### 8.3 Reliable event handling

For the initial version, document the limitations of in-memory tasks: queued work may be lost if the process stops.

For a stronger implementation, use a **transactional outbox**:
1. Update the issue and insert an outbox event in the same database transaction.
2. A background worker polls pending outbox events.
3. The worker processes events and records completion or retry state.
4. Processing is idempotent so a repeated event does not create duplicate effects.
5. Failed events use bounded retries and a visible failed/dead-letter state.

Implement the outbox only after the basic workflow is stable. Use row locking or another deliberate claiming strategy so two workers do not process the same event concurrently. Keep database transactions short and avoid holding locks during slow external network calls.

### 8.4 Concurrent issue updates

Use optimistic locking with a JPA `@Version` field. If two users edit the same issue, detect a stale update and return a clear conflict response (typically HTTP `409 Conflict`) instead of silently overwriting data.

For issue numbering, use a database-safe strategy. Do not use `MAX(issue_number) + 1` without locking or another safe allocation method.

### 8.5 Scheduled reminders

If implemented, run a scheduled task for upcoming due dates. Prevent duplicate reminders, define the timezone policy, and make the task safe to retry. If multiple application instances are supported, ensure the scheduler does not send duplicate reminders.

### 8.6 Concurrency tests

Add tests that verify:
- Simultaneous issue creation does not generate duplicate issue keys.
- Concurrent updates do not silently overwrite each other.
- Queue capacity and rejection behavior are as documented.
- Multiple workers do not create duplicate logical notifications for the same event.
- Application shutdown stops accepting new background work and handles in-flight work according to policy.

Avoid flaky tests based only on `Thread.sleep()`. Prefer latches, barriers, bounded waits, and explicit assertions.

### 8.7 Performance measurements

Create a repeatable benchmark or load-test script. Measure:
- Requests or jobs processed per second
- Average and percentile latency (p50/p95/p99 where practical)
- Error rate
- Queue depth and worker utilization
- Behavior as worker count changes

Compare sequential processing with bounded concurrent processing using the same workload and environment. Record hardware, configuration, test data, and method. Do not invent results or claim that multithreading always improves performance; database and network limits may become the bottleneck.

---

## 9. Frontend Requirements

Create a coherent, responsive product UI. Avoid a generic landing page with buttons that do not work.

### Main pages

1. **Login/Register:** validated forms and clear errors.
2. **Workspace/Projects:** project list, create project, project overview.
3. **Project board:** Kanban columns and issue cards.
4. **Issue detail:** description, status, priority, assignee, due date, comments, activity.
5. **Create/Edit issue:** accessible, validated form.
6. **Notifications:** unread count, list, read actions.
7. **Dashboard:** useful summary cards, workload, overdue items, recent activity.
8. **Profile:** current-user information and sign-out.

### UX expectations

- Responsive desktop and mobile layouts.
- Consistent typography, spacing, colors, buttons, and form controls.
- Accessible labels and keyboard focus states.
- Loading skeletons or indicators where useful.
- Empty states that explain how to get started.
- Error messages with a way to recover.
- Confirmation for destructive actions.
- Optimistic updates only where rollback/reconciliation is implemented.
- No fake analytics, nonfunctional controls, or hard-coded data presented as live server data.

### Frontend architecture

Suggested structure:

```text
frontend/
  src/
    app/
    api/
    components/
    features/
      auth/
      projects/
      issues/
      comments/
      notifications/
      dashboard/
    hooks/
    layouts/
    pages/
    types/
    utils/
```

Centralize API access, handle authentication consistently, and keep TypeScript types aligned with the API contract.

---

## 10. Security Requirements

- Hash passwords securely.
- Validate and normalize all client input on the server.
- Enforce project membership and role checks on every relevant endpoint.
- Prevent insecure direct object reference (IDOR) vulnerabilities.
- Configure CORS narrowly for the actual frontend origin.
- Use secure cookie settings and CSRF defenses when cookie-based authentication is used.
- Never commit passwords, API keys, JWT signing secrets, or production credentials.
- Use environment variables or a secret manager.
- Use parameterized queries and safe data access patterns.
- Limit request payload sizes where appropriate.
- Avoid logging passwords, tokens, or sensitive user content.
- Configure production error responses so stack traces and internal details are not exposed.
- Add basic rate limiting for sensitive endpoints if feasible.
- Use HTTPS in deployment.
- Document any security limitation honestly.

---

## 11. Testing Strategy

### Backend unit tests
- Service validation and business rules
- Role/permission decisions
- Issue state transitions
- Notification creation rules
- Retry and failure handling

### Backend integration tests
- Authentication and authorization
- Database constraints and migrations
- Project/issue CRUD
- Pagination and filtering
- Transaction rollback behavior
- Concurrent update conflicts
- Outbox/worker behavior if implemented

Use PostgreSQL integration tests, ideally through Testcontainers when practical. Tests should not depend on a developer's personal database.

### Frontend tests
- Login and form validation
- Issue creation/editing flows
- Board status update behavior
- Error, loading, and empty states
- Notification read behavior

### Definition of done
A feature is not complete until its backend behavior, frontend behavior, validation, authorization, and appropriate tests work together.

---

## 12. Local Development and Deployment

Provide a Docker Compose setup for local PostgreSQL and any required services. The application should run using documented commands and environment variables.

Expected developer experience:
1. Clone repository.
2. Copy `.env.example` to `.env`.
3. Start dependencies with Docker Compose.
4. Run Flyway migrations automatically or through a documented command.
5. Start backend with Maven.
6. Start frontend with the package manager.
7. Run tests with documented commands.

Include:
- `.env.example` containing placeholders only.
- Dockerfiles where appropriate.
- Docker Compose configuration.
- Health/readiness endpoints appropriate to the environment.
- GitHub Actions workflow for tests and build.
- Deployment instructions.
- No committed real `.env` file or secrets.

For deployment, ensure the backend's allowed frontend origin, database URL, credentials, cookie/security settings, and HTTPS behavior are configured for the production environment.

---

## 13. Documentation Requirements

The repository README must contain:
- What the application does and the problem it solves
- Feature list and current implementation status
- Architecture diagram (Mermaid is acceptable)
- Technology stack
- Database/entity relationship overview
- Local setup instructions
- Environment variable reference
- How to run backend, frontend, and tests
- API documentation link
- Authentication and authorization overview
- Explanation of thread-pool configuration and queue policy
- Concurrency guarantees and known limitations
- Benchmark method and actual measured results, if available
- Screenshots or a short demo GIF
- Deployment link, if deployed
- Future improvements

Also document why important design choices were made, including optimistic locking, background processing, and the chosen authentication strategy.

---

## 14. Suggested Milestones

### Milestone 1: Foundation
- Set up repository, backend, frontend, PostgreSQL, and Flyway.
- Create user/project entities and migrations.
- Add registration, login, and security tests.

### Milestone 2: Issue management
- Implement project membership and authorization.
- Build issue CRUD, filtering, pagination, and optimistic locking.
- Build the first usable project and issue screens.

### Milestone 3: Collaboration
- Add comments and activity events.
- Build the Kanban board.
- Add dashboard endpoints and UI.

### Milestone 4: Background processing
- Add in-app notifications.
- Configure a bounded worker pool.
- Add queue metrics, retry behavior, and concurrency tests.
- Consider the transactional outbox for durable processing.

### Milestone 5: Production polish
- Improve validation, security, and accessibility.
- Complete tests and API documentation.
- Add Docker, CI, and deployment.
- Write a high-quality README with screenshots and actual benchmark data.

---

## 15. Acceptance Checklist

### Product
- [ ] A user can register and sign in.
- [ ] A user can create a project and manage its members.
- [ ] Authorized users can create, assign, filter, and update issues.
- [ ] The Kanban board reflects persisted issue status.
- [ ] Comments and activity history work.
- [ ] Notifications are private to their recipient.
- [ ] Dashboard numbers come from real backend data.
- [ ] Empty, loading, validation, and failure states are implemented.

### Backend quality
- [ ] DTOs are used instead of exposing JPA entities.
- [ ] Validation and consistent exception handling are in place.
- [ ] Authorization is enforced server-side.
- [ ] Database migrations and constraints are included.
- [ ] Pagination and filtering are server-side.
- [ ] Concurrent updates are handled intentionally.
- [ ] Background execution is bounded and observable.
- [ ] Retries and duplicate-processing behavior are documented.

### Delivery
- [ ] Tests run from a clean checkout.
- [ ] Docker-based local setup is documented.
- [ ] CI runs the relevant tests/build.
- [ ] OpenAPI documentation is available.
- [ ] No secrets are committed.
- [ ] README includes screenshots and architecture.
- [ ] Performance claims match measured evidence.
- [ ] The application is deployed or has reproducible local instructions.

---

## 16. Instructions for the Coding Agent (Antigravity)

Follow these instructions while implementing the project:

1. Inspect the existing repository before changing files. Preserve useful existing work.
2. If the repository is empty, create a clean `backend/` and `frontend/` structure.
3. First write a short implementation plan and scaffold the application.
4. Implement one milestone at a time, in the order above.
5. Before adding a dependency, confirm it is needed and compatible with the chosen Java/Spring versions.
6. Do not replace real backend integration with mock data except for explicitly isolated frontend previews.
7. Do not create placeholder buttons, fake charts, TODO-only services, or empty tests and claim the feature is complete.
8. Add meaningful automated tests as each feature is implemented.
9. Run tests and builds after each milestone; fix failures before continuing.
10. Use secure defaults and validate authorization on the backend.
11. Explain important concurrency choices in code comments and documentation without commenting every line.
12. Do not claim scalability, production readiness, or performance improvements without evidence.
13. If a requirement is ambiguous, choose the simplest robust option and document the choice.
14. Keep the architecture a modular monolith unless there is a concrete, justified need to change it.
15. At the end of each milestone, report: files/features added, tests executed and their actual outcomes, known limitations, and the next milestone.

### First task

Begin with **Milestone 1 only**. Inspect the repository, present a concise plan, scaffold the backend and frontend, configure PostgreSQL/Flyway and development instructions, and implement the initial user/authentication foundation with tests. Do not attempt to generate the entire application in one pass. Once Milestone 1 builds and tests successfully, summarize the results and proceed to Milestone 2.
