# Deployment

## Build and run

```bash
npm ci
npm run build   # runs scripts/build-avatar-crops.mjs first (prebuild)
npm run start
```

## Vercel (recommended)

1. Import the repository at [vercel.com](https://vercel.com).
2. Every push to `main` deploys automatically.

Heavy local sources (`docs/`, `perf/`) are excluded via `.gitignore` / `.vercelignore`
to stay under the serverless bundle limit.

## Home server (sub-path /genealogy)

`NEXT_PUBLIC_BASE_PATH=/genealogy` at build time sets Next's `basePath`; `src/lib/utils/basePath.ts`
prefixes the root-relative URLs Next does not handle itself (image `src`, `/photos/…` inside rich text,
map popups, PDF fonts). Without the variable the build is unchanged (Vercel, domain root).

```bash
# .env.deploy: DEPLOY_HOST=user@host
npm run deploy -- --stage          # first time: upload a release to ~/.local/share/genealogy
sudo bash deploy/server-setup.sh   # on the server, once: systemd unit on 127.0.0.1:3122 + Caddy route
npm run deploy                     # every later release; rolls back if the health check fails
```

## Standalone (Docker, VPS)

`next.config.ts` sets `output: 'standalone'`, so the build produces a self-contained server in `.next/standalone`:

```bash
npm run build
cd .next/standalone
node server.js
```

Docker:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_ADMIN_API` | unset | The admin helper endpoints (`/api/admin/photos/scan`, `/api/map/geocode`) are available in development only. Set to `true` to enable them in a production build (e.g. a private self-hosted instance). |

The admin screen itself never writes to the server: edits live in the browser session and are exported as `data.json`, which you commit back to `src/data/`.
