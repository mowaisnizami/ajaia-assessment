# GHCR, Nginx Proxy Manager, and Cloudflare Tunnel Deployment

This deployment uses the published GitHub Container Registry images. It does
not build source code on the server and exposes no Docker host ports.

```text
Visitor HTTPS
  -> Cloudflare Tunnel
  -> Nginx Proxy Manager on the Docker network
  -> docflow-web:80
  -> docflow-api:3000 (private Docker network)
  -> existing PostgreSQL container:5432
```

## Before starting

1. Wait for the GitHub Actions run for the desired commit to finish green.
2. Confirm the existing PostgreSQL container is attached to the external
   `nginxproxymanager` Docker network and note its container name or network
   alias.
3. Create a dedicated `docflow` database and role in PostgreSQL. Do not reuse
   an unrelated application database.
4. Confirm the Nginx Proxy Manager and `cloudflared` containers are attached
   to the same external network.

If GHCR packages are private, create a GitHub fine-grained personal access
token with **Packages: Read**, then authenticate once on the server:

```bash
echo '<GITHUB_TOKEN>' | docker login ghcr.io -u mowaisnizami --password-stdin
```

## Server files

On the server, create a directory such as `/opt/docflow` and copy these two
repository files into it:

- `deploy/docker-compose.ghcr.yml`
- `deploy/.env.example` renamed to `.env`

Edit `.env` with the exact PostgreSQL network name, database credentials, and
public hostname. If a password contains `@`, `:`, `/`, or another URL-reserved
character, URL-encode it before it becomes part of `DATABASE_URL`.

Start the stack:

```bash
cd /opt/docflow
docker compose --env-file .env -f docker-compose.ghcr.yml pull
docker compose --env-file .env -f docker-compose.ghcr.yml up -d
docker compose --env-file .env -f docker-compose.ghcr.yml ps
docker compose --env-file .env -f docker-compose.ghcr.yml logs --tail=100 api
```

The first boot creates the assessment tables, including document version
history, because `DATABASE_SYNCHRONIZE=true`. Do not set it to false until a
migration strategy exists for future schema updates.

## Nginx Proxy Manager

Create a new **Proxy Host**:

| Field | Value |
| --- | --- |
| Domain Names | `app.your-domain.example` |
| Scheme | `http` |
| Forward Hostname / IP | `docflow-web` |
| Forward Port | `80` |
| Websockets Support | enabled |
| Block Common Exploits | enabled |

Do not forward to the API. The web container securely proxies `/api` to the
private API container. Do not publish `80`, `3000`, or `5432` as host ports in
this deployment.

NPM does not need a Let's Encrypt certificate when Cloudflare Tunnel is the
only public entry point: browser-to-Cloudflare TLS is handled by Cloudflare and
the NPM hop remains inside Docker. You may still issue one if you also expose
NPM directly, but that is not recommended for this stack.

## Cloudflare Tunnel

In **Cloudflare Zero Trust -> Networks -> Tunnels**, open the existing named
tunnel and add a **Published application** route:

| Field | Value |
| --- | --- |
| Public hostname | `app.your-domain.example` |
| Service type | `HTTP` |
| URL | `http://<NPM_CONTAINER_NAME>:80` |

`<NPM_CONTAINER_NAME>` is the Docker name/alias of Nginx Proxy Manager on the
`nginxproxymanager` network. It is not `localhost`; from the cloudflared
container, `localhost` would refer to cloudflared itself.

Cloudflare creates the CNAME to the tunnel automatically when adding this
route. In NPM, preserve the same hostname so its proxy-host rule matches the
incoming `Host` header.

## Verify and update

```bash
curl -I https://app.your-domain.example
curl -fsS https://app.your-domain.example/api/health
docker compose --env-file .env -f docker-compose.ghcr.yml ps
```

For an update, set `IMAGE_TAG` to the new green GitHub Actions SHA tag, then:

```bash
docker compose --env-file .env -f docker-compose.ghcr.yml pull
docker compose --env-file .env -f docker-compose.ghcr.yml up -d
```

## Domain options

Cloudflare Free includes DNS and named Tunnels, but a stable public hostname
requires a domain zone using Cloudflare nameservers. `trycloudflare.com` Quick
Tunnels are free but random, temporary, and intended only for testing.

The only plausible no-cost route is to apply for an `eu.org` subdomain and
delegate its nameservers to Cloudflare. It is manual, approval can be slow, and
it is not suitable to rely on for a time-sensitive production URL. Do not use
`is-a.dev` for this self-hosted app: its rules say NS delegation for self
hosting is subject to discretionary review and normally requires an existing
subdomain history.

For a stable job-portfolio link, the practical recommendation is a low-cost
domain registered with Cloudflare Registrar (at-cost) or another registrar that
allows changing nameservers. Then add the domain to Cloudflare Free, use its
assigned nameservers, and configure `app.<your-domain>` as above.
