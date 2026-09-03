# AI Workflow Note

This assessment used Codex intentionally as an engineering accelerator. The
candidate retained responsibility for scope, tradeoffs, review, verification,
and the final implementation.

## 1. Decomposition

AI translated the product prompt into a delivery contract centered on the
required end-to-end path: create/import, rich-text editing, persistence,
sharing, and server-side authorization. Optional real-time collaboration,
DOCX, comments, versions, export, and account recovery were deferred because
they did not improve the assessment's critical workflow inside the timebox.

## 2. Architecture and scaffolding

AI accelerated the Angular/NestJS workspace, PostgreSQL entities, container
topology, security baseline, CI workflow, and reviewer documentation. A
modular monolith and explicit save were selected because they reduce failure
modes without weakening the required product behavior.

## 3. Implementation

AI produced reviewable feature slices rather than one undifferentiated output:

1. seeded user identity and persistence model;
2. document CRUD and file import;
3. explicit access-policy service;
4. rich-text Angular workspace and sharing controls;
5. Docker/Nginx deployment and GitHub Actions;
6. tests, HTTP verification, documentation, and evidence.

## 4. Important changes and rejected suggestions

- Full password/account management was rejected. The prompt permits seeded or
  mocked authentication, and the time was better spent proving server RBAC.
- Microservices and real-time collaboration were rejected as unjustified
  operational and synchronization risk.
- A cached global CLI approach was abandoned after incomplete transitive
  packages made it non-reproducible; dependencies are versioned in the repo.
- `ngx-quill` was pinned to the Angular 21-compatible major after the newest
  release declared Angular 22 peers.
- Service-specific Docker installation was selected over copying a large
  monorepo dependency tree, keeping builds deterministic and focused.
- The API health check uses `127.0.0.1`; Alpine resolved `localhost` to IPv6
  while Nest listened on IPv4 in the container.

## 5. AI-assisted debugging

The first browser smoke test stayed on “Loading workspace” even though API and
Nginx requests returned 200. This disproved the assumption that a successful
production build implied a functioning page. The issue was Angular 21
zoneless change detection around manual RxJS subscriptions. Explicit view
refreshes were added at asynchronous state boundaries, followed by a rebuilt
image and repeated browser verification.

## 6. Verification standard

Generated code was accepted only after the relevant evidence gate:

- NestJS compile and unit tests
- Angular unit test and production build in Linux
- Docker Compose health checks
- real PostgreSQL HTTP workflow
- owner create/import/share behavior
- collaborator list/reopen behavior
- HTTP 403 on viewer update
- clean-browser UI inspection
- documentation cross-check and rendered PDF inspection

The execution record and exact results are in `EXECUTION_LOG.md`; the
reviewer-facing evidence is in `output/pdf/DocFlow-Testing-Evidence.pdf`.
