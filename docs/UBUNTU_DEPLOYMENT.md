# Ubuntu Deployment Runbook

The production-shaped local Compose stack is compatible with an Ubuntu server.
Use a non-root sudo user, a strong database password, and a reverse proxy with
TLS before exposing the service publicly.

## 1. Install Docker Engine

Follow Docker's official Ubuntu repository instructions, then verify:

```bash
docker --version
docker compose version
```

Add the deployment user to the Docker group only if that privilege model is
acceptable for the server; Docker group membership is effectively root access.

## 2. Obtain and configure the application

```bash
git clone https://github.com/mowaisnizami/ajaia-assessment.git
cd ajaia-assessment
cp .env.example .env
nano .env
```

For a private repository, authenticate with a deploy key or GitHub token. Set a
long unique `POSTGRES_PASSWORD` in `.env`. Do not commit that file.

## 3. Build and start

```bash
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 api
curl --fail http://127.0.0.1:3000/api/health
```

The web interface listens on port 8080, API on 3000, and PostgreSQL on 5432.
For an internet-facing host, use a firewall/security group to expose only SSH,
HTTP, and HTTPS. Remove the database host-port mapping if external database
access is unnecessary.

## 4. Reverse proxy and TLS

Route a domain to `http://127.0.0.1:8080` through the host's Nginx, Caddy, or
Traefik and issue a Let's Encrypt certificate. Update `CORS_ORIGIN` in
`docker-compose.yml` or an environment override if the API is accessed from a
different browser origin. The provided web container already proxies `/api`
same-origin, so a single public domain is preferred.

## 5. Updates

```bash
git pull --ff-only
docker compose up --build -d
docker image prune -f
```

GitHub Actions also publishes GHCR images. Compose can be changed to reference
the published `web` and `api` tags instead of building on the server, provided
the server is authenticated to GHCR when the package is private.

## 6. Operations

```bash
docker compose ps
docker compose logs -f --tail=200
docker compose restart api web
```

Back up the named PostgreSQL volume with `pg_dump` before upgrades. Test restore
procedures, rotate secrets, apply OS security updates, and monitor disk space.
Before treating this assessment build as production, replace schema
synchronization with migrations and the mocked identity header with real
authentication.
