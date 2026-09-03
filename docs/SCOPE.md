# Scope and Acceptance Contract

## Product Slice

Ship a coherent collaborative document workflow rather than imitate all of
Google Docs. A reviewer must be able to sign in, create and format a document,
save and reopen it, import a supported file, share the document, and verify the
second user's access.

## Must Have

- Two seeded reviewer accounts with a lightweight login flow
- Owned and shared document lists
- Create and rename a document
- Rich text: bold, italic, underline, headings, bullets, and numbered lists
- Explicit save and reliable reopen after refresh
- PostgreSQL persistence for documents and shares
- Import at least `.txt`; add `.md` after the text flow is reliable
- Share an owned document with another seeded user
- Visible owned/shared distinction
- Server-side access checks for every document read and mutation
- Helpful validation and error states
- One meaningful automated authorization test
- Public deployment, setup documentation, and walkthrough video

## Should Have

- `VIEWER` and `EDITOR` share permissions
- Saved/unsaved editing status
- File type and 1 MB size validation
- Responsive dashboard and editor layouts
- Additional access-control tests if the core flow finishes early

## Intentionally Not Building

- Real-time multi-user synchronization or presence
- Comments, suggestions, or version history
- OAuth, registration, password recovery, or email verification
- Email delivery for invitations
- `.docx` parsing
- PDF export
- Organizations, teams, or enterprise ACL inheritance
- Microservices, Redis, queues, or Kubernetes

These omissions protect the core editing, persistence, sharing, deployment, and
verification requirements inside the timebox.

## Definition of Done

The required product slice is complete only when it works from a clean browser
against the public deployment:

1. Owner signs in.
2. Owner creates, formats, saves, refreshes, and reopens a document.
3. Owner imports a supported file.
4. Owner shares a document with the collaborator.
5. Collaborator signs in and sees the document under Shared with me.
6. The API rejects an operation outside the collaborator's permission.
7. The authorization test passes.
8. All reviewer links and credentials work without requesting access.
