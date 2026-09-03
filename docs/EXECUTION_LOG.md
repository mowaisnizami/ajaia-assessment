# Execution Log

## Step 1 — Scope and repository

Status: complete

- Initialized a Git repository on `main` and set the supplied GitHub repository
  as `origin`.
- Defined required, optional, and excluded capabilities in `SCOPE.md`.
- Selected Angular, NestJS, PostgreSQL, TypeORM, Quill, Docker, and GitHub
  Actions.

The remote repository requires credentials unavailable to this command-line
session. Development continued locally; the final commit is ready to push once
Git or GitHub CLI is authenticated.

## Step 2 — Foundation and deployment

Status: complete

- Created the Angular 21 and NestJS 11 applications.
- Added PostgreSQL/TypeORM configuration, validation, Helmet, CORS, and health.
- Added Nginx, multi-stage Dockerfiles, Compose health checks, named storage,
  environment examples, and the GitHub Actions image workflow.

## Step 3 — Product workflow

Status: complete

- Seeded owner and collaborator database identities.
- Implemented create, list, reopen, update, and text/Markdown import.
- Added Quill rich-text editing and responsive document cards/editor layout.
- Implemented owner/editor/viewer access resolution and owner-only sharing.

## Step 4 — Automated verification

Status: passed

- NestJS production compile: passed.
- NestJS tests: 2 suites, 3 tests, all passed.
- Access-policy assertions: owner/editor may edit, viewer may not; owner alone
  may share.
- Angular production build in a clean Linux Docker stage: passed.
- Angular unit test: passed in the Docker build gate.
- Docker Compose: database and API healthy; web running.

## Step 5 — Full HTTP integration

Status: passed against the running Docker environment and real PostgreSQL

```json
{
  "health": "ok",
  "usersSeeded": 2,
  "createdTitle": "Assessment launch plan",
  "richTextPersisted": true,
  "importedTitle": "import-sample",
  "sharedCountForCollaborator": 1,
  "reopenedAccess": "VIEWER",
  "viewerEditStatus": 403
}
```

The test created rich text as the owner, imported a Markdown fixture, granted
viewer access, listed and reopened the share as the collaborator, and proved a
viewer update was rejected.

## Step 6 — Browser verification and correction

Status: passed after correction

The first production-browser pass revealed a zoneless Angular refresh issue:
the API returned valid data but the dashboard remained in its loading state.
Explicit change detection was added for asynchronous subscription updates, the
web image was rebuilt, and the workflow was retested in a clean browser.

## Step 7 — Delivery

Status: complete locally

- Local application available at `http://localhost:8080`.
- Ubuntu-compatible deployment runbook added.
- GitHub Actions builds/tests/publishes both images on commits.
- Testing evidence PDF generated, rendered, and content-checked.
- Public URL, walkthrough recording, and GitHub push require candidate-owned
  credentials/infrastructure and remain the only external follow-ups.
