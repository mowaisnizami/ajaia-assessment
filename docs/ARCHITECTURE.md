# Architecture Note

## Objective

The design optimizes for a complete, testable product slice under a four-hour
assessment constraint. It favors conventional components, explicit access
rules, and a deployment a reviewer can reproduce with one command.

## Runtime topology

```text
Browser
  |
  v
Nginx + Angular SPA -- /api --> NestJS API -- TypeORM --> PostgreSQL
                                        |
                                        +-- identity lookup and RBAC policy
```

Nginx serves the production Angular files and proxies `/api` to NestJS. Browser
calls remain same-origin. Docker Compose supplies separate web, API, and
database services with health-based startup ordering.

## Data model

### User

- UUID primary key
- unique email, display name, creation timestamp
- two deterministic reviewer rows are seeded at startup

### Document

- UUID primary key
- title limited to 200 characters
- rich-text HTML content
- owner foreign key and timestamps

### DocumentShare

- document/user foreign-key pair with a unique constraint
- permission enum: `VIEWER` or `EDITOR`
- creation/update timestamps

## Identity and authorization

The assignment permits seeded accounts and mocked authentication. The client
selects a seeded identity and sends its UUID in `x-user-id`. The API validates
that the ID belongs to a seeded database user before resolving document access.
This makes the demo immediate while keeping authorization outside the client.

| Operation | Owner | Editor | Viewer | Unshared |
| --- | ---: | ---: | ---: | ---: |
| List/reopen | Yes | Yes | Yes | No |
| Rename/edit | Yes | Yes | No | No |
| Grant/update share | Yes | No | No | No |

The highest-value policy and integration tests prove that a viewer receives
HTTP 403 when attempting an update.

This identity mechanism is explicitly not production authentication. A
production release would replace it with OIDC or signed sessions without
changing the document access policy.

## Key decisions

### Modular monolith

NestJS user and document modules keep boundaries clear without distributed
systems overhead that the assessment domain does not need.

### PostgreSQL rather than browser or memory storage

Ownership and sharing are relational, and saved content must survive refreshes
and restarts. A named volume preserves PostgreSQL data across container
recreation.

### Explicit save

The required workflow is save and reopen. Explicit save avoids autosave races
while producing a clear first-release user interaction.

### HTML rich-text persistence

Quill provides formatting and round-trip HTML without a custom document
operation model. File import escapes source text before converting paragraphs,
so uploaded text is not interpreted as HTML. A public multi-tenant release
would add a reviewed sanitizer at the API boundary.

### Text and Markdown import

The import endpoint accepts only `.txt` and `.md`, limits input to 1 MB, and
stores readable paragraph content. DOCX and binary formats were excluded to
protect delivery of the core access-control workflow.

### Schema synchronization only for the assessment

`DATABASE_SYNCHRONIZE=true` makes a fresh evaluation environment deterministic.
It is environment-controlled and should be replaced by reviewed migrations on
a persistent production system.

## Security baseline

- Helmet response headers
- global DTO validation, whitelist, and unknown-property rejection
- exact CORS allowlist
- seeded-user validation on every protected route
- server-side owner/editor/viewer policy
- upload type and size limits
- configuration through environment variables
- no real credentials committed

## Deployment and CI

Multi-stage Dockerfiles run unit tests and production compilation before
creating minimal service images. Docker Compose health checks gate API and web
startup. GitHub Actions builds both images for pull requests and commits;
successful pushes publish SHA tags to GHCR.

## Production follow-ups

- OIDC/signed session authentication and rate limiting
- migrations and automated backup/restore validation
- HTML sanitization and security scanning
- share revocation, audit history, and document versions
- browser automation, accessibility, and load testing
- real-time co-editing only after selecting a conflict-resolution model
