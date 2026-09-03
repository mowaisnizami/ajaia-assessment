# DocFlow Collaborative Editor

DocFlow is a complete, deliberately scoped collaborative document editor for
the Ajaia AI-Native Full Stack Developer assessment. It delivers rich-text
editing, PostgreSQL persistence, text/Markdown import, document ownership,
sharing, and server-enforced role-based access in a reproducible container
environment.

## Delivery status

| Capability | Status |
| --- | --- |
| Angular editor and responsive workspace | Complete |
| NestJS REST API and PostgreSQL persistence | Complete |
| Seeded reviewer identities | Complete |
| Create, save, reopen, and import documents | Complete |
| Owner / editor / viewer authorization | Complete and tested |
| Version history and collaboration presence | Complete and tested |
| Client-side PDF export | Complete and browser-verified |
| Local three-container deployment | Running and verified |
| GitHub Actions Docker image builds | Complete |
| Testing evidence PDF | Complete |
| Public hosting and walkthrough video | Reviewer/candidate follow-up |

## Stack

- Angular 21 standalone client with Quill rich-text editing
- NestJS 11 REST API, TypeORM, and PostgreSQL 17
- Nginx for the production SPA and same-origin `/api` proxy
- Docker Compose for web, API, and database services
- Jest and Angular unit tests built into image creation
- GitHub Actions and GitHub Container Registry (GHCR)

## Quick start

Prerequisite: Docker Desktop or Docker Engine with the Compose plugin.

```bash
docker compose up --build -d
docker compose ps
```

Open `http://localhost:8080`. The API health endpoint is
`http://localhost:3000/api/health`.

Two accounts are seeded automatically. Use the **Working as** selector:

| Reviewer identity | Email | Intended use |
| --- | --- | --- |
| Owen Owner | `owner@docflow.test` | Create, edit, import, and grant access |
| Casey Collaborator | `collaborator@docflow.test` | Verify viewer/editor behavior |
| Amara Engineer | `amara.engineer@docflow.test` | Additional sharing and editor scenario |
| Priya Reviewer | `priya.reviewer@docflow.test` | Additional reviewer scenario |
| Noah Product | `noah.product@docflow.test` | Additional reviewer scenario |

No password is required in this assessment build. Identity is intentionally
mocked with a seeded selector and an `x-user-id` request header, while every
document authorization decision remains enforced by the API.

## Reviewer walkthrough

1. Select **Owen Owner** and create a document.
2. Add formatted content and save it.
3. Return to Documents, reopen it, and confirm persistence.
4. Import a `.txt` or `.md` file (maximum 1 MB).
5. Open a document and grant `collaborator@docflow.test` Viewer access.
6. Switch to **Casey Collaborator** and open the shared document.
7. Confirm the editor is read-only. A direct update request is also rejected
   by the server with HTTP 403.
8. Change the share to Editor as the owner and repeat to verify editing.
9. Use **Export PDF** from any opened document to download its title and readable content.
10. Review the right-hand **Version history** and **Live collaborators** panels.

## API

Except for users and health, document routes require a valid seeded
`x-user-id` header.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health/readiness response |
| `GET` | `/api/users` | List seeded reviewer identities |
| `GET` | `/api/documents` | List owned and shared documents |
| `POST` | `/api/documents` | Create a document |
| `POST` | `/api/documents/import` | Import `.txt` or `.md` content |
| `GET` | `/api/documents/:id` | Reopen an authorized document |
| `PATCH` | `/api/documents/:id` | Rename/edit as owner or editor |
| `POST` | `/api/documents/:id/shares` | Grant/update access as owner |
| `GET` | `/api/documents/:id/versions` | List authorized document versions |
| `POST` | `/api/documents/:id/presence` | Refresh the current user's collaboration heartbeat |

DTO validation rejects unknown fields. File uploads are restricted by type and
size. Helmet, explicit CORS configuration, and server-side access checks form
the assessment security baseline.

## Development commands

Prerequisites: Node.js 22+, pnpm 11+, and PostgreSQL.

```bash
pnpm install
pnpm dev:server
pnpm dev:client
pnpm build
pnpm test
```

Environment variables are documented in `.env.example` and
`server/.env.example`. `DATABASE_SYNCHRONIZE=true` is limited to the assessment
environment; reviewed migrations are the production follow-up.

## CI and deployment

`.github/workflows/docker.yml` builds both service images on pull requests and
every commit. Pushes publish SHA-tagged images to GHCR, with `latest` on the
default branch. Tests execute inside each Docker build, so an image is not
published if its service tests fail.

Ubuntu deployment instructions are in
[`docs/UBUNTU_DEPLOYMENT.md`](docs/UBUNTU_DEPLOYMENT.md). The same Compose
definition used locally is Linux-compatible.

For a deployment that pulls signed-in GHCR images behind an existing Nginx
Proxy Manager and Cloudflare Tunnel, use
[`docs/GHCR_NPM_CLOUDFLARE_DEPLOYMENT.md`](docs/GHCR_NPM_CLOUDFLARE_DEPLOYMENT.md).

## Evidence and design notes

- [`output/pdf/DocFlow-Testing-Evidence.pdf`](output/pdf/DocFlow-Testing-Evidence.pdf)
- [`docs/SCOPE.md`](docs/SCOPE.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/AI_WORKFLOW.md`](docs/AI_WORKFLOW.md)
- [`docs/EXECUTION_LOG.md`](docs/EXECUTION_LOG.md)
- [`SUBMISSION.md`](SUBMISSION.md)

## Candidate

Muhammad Owais Nizami
