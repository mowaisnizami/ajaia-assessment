# Ajaia Assessment Submission

## Candidate

Muhammad Owais Nizami

## Source repository

https://github.com/mowaisnizami/ajaia-assessment

The implementation is committed locally. The repository is private and the
current command-line session does not have GitHub credentials; push the local
commit after authenticating Git or GitHub CLI.

## Application

- Local web application: `http://localhost:8080`
- Local API health: `http://localhost:3000/api/health`
- Public deployment URL: pending candidate/server deployment
- Walkthrough video: pending recording after public deployment

## Reviewer access

Use the **Working as** selector in the application header. The assessment uses
two seeded identities rather than a password flow:

- Owen Owner — `owner@docflow.test`
- Casey Collaborator — `collaborator@docflow.test`

## Included and verified

- Responsive Angular rich-text workspace
- NestJS REST API with validated DTOs and security headers
- PostgreSQL persistence
- Create, save, reopen, list, and text/Markdown import
- Owner, editor, viewer, and unshared server authorization rules
- Owner-only sharing by seeded email
- Five visible seeded reviewer identities with email addresses
- Version history recorded on creation, import, and save
- Recently-active collaboration presence indicators
- Client-side PDF export for opened documents
- Three-service Docker Compose environment running locally
- Unit tests, production builds, and full HTTP integration evidence
- GitHub Actions Docker build/publish workflow
- Ubuntu deployment runbook
- Architecture, scope, AI workflow, execution log, and evidence PDF

## Known constraints

- Mocked seeded identity is deliberate and permitted by the assignment; it is
  not production authentication.
- Schema synchronization is enabled only for the deterministic assessment
  environment; production should use migrations.
- Rich text is stored as HTML. Production hardening should add a reviewed HTML
  sanitization policy before accepting untrusted external users.
- Share revocation, history, comments, export, and real-time co-editing are out
  of the agreed assessment scope.
- Public hosting and video require candidate-owned infrastructure/account
  access and are therefore documented but not fabricated.

## Next production-hardening steps

1. Replace the seeded header with OIDC or signed session authentication.
2. Add migrations, secret management, TLS, and a restricted database port.
3. Add HTML sanitization, audit history, rate limiting, and share revocation.
4. Add browser automation and accessibility checks to CI.
