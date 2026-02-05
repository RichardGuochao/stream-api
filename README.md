# Video REST APIs for Cloudflare Worker

A video upload and streaming platform using [Hono](https://hono.dev/) on [Cloudflare Workers](https://developers.cloudflare.com/workers/), with [R2](https://developers.cloudflare.com/r2/) for storage, [D1](https://developers.cloudflare.com/d1/) for metadata, and [Cloudflare Stream](https://developers.cloudflare.com/stream/) for live streaming.

## Tech Stack

- **Runtime**: Cloudflare Workers  
- **Framework**: Hono  
- **Language**: TypeScript  
- **Storage**: Cloudflare R2  
- **Streaming**: Cloudflare Stream  
- **Database**: Cloudflare D1  
- **Auth**: Google OAuth + JWT  
- **Deployment**: Wrangler CLI  

## Project Structure

```
src/
├── index.ts              # Entry point
├── routes/
│   ├── auth.ts           # POST /auth/google, GET /auth/me
│   ├── videos.ts         # Video upload, create, list, get
│   └── streams.ts        # Live stream create, start, end, playback
├── middleware/
│   ├── auth.ts           # JWT auth middleware
│   └── logger.ts         # Request logging
├── services/
│   ├── r2.ts             # R2 presigned URLs
│   ├── stream.ts         # Cloudflare Stream API
│   └── google-auth.ts    # Google ID token verification
├── utils/
│   ├── response.ts       # Response helpers
│   └── jwt.ts            # JWT helpers
└── types/
    └── index.ts          # Shared types
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create D1 database

Create the database (run this first if you haven’t already):

```bash
npx wrangler d1 create video_streaming_db
```

The command prints a `[[d1_databases]]` block containing `database_id`. Copy that **entire block** into `wrangler.toml`, replacing the existing `[[d1_databases]]` section, or at least copy the `database_id` value (a UUID) into the existing `database_id` field.

Example output:

```
[[d1_databases]]
binding = "DB"
database_name = "video_streaming_db"
database_id = "e63e4c58-d582-4b27-a6fa-4d1abfe590a8"
```

Without a valid `database_id` in `wrangler.toml`, remote migrations (`npm run db:remote`) will fail.

### 3. Create R2 bucket

```bash
wrangler r2 bucket create video-uploads
```

**R2 CORS (required for browser uploads):** If your frontend uploads to the presigned URL from the browser (e.g. Cloudflare Pages), the R2 bucket must have a CORS policy or the browser will block the request.

- **Dashboard:** R2 → select bucket `video-uploads` → **Settings** → **CORS Policy** → **Add CORS policy** → paste the contents of `r2-cors.json` (or edit origins to match your frontend).
- **CLI:** `npm run r2:cors` (or `npx wrangler r2 bucket cors set video-uploads --file r2-cors.json`)

Update `r2-cors.json` so `AllowedOrigins` includes your frontend origin (e.g. `https://your-app.pages.dev`). The repo’s `r2-cors.json` includes `https://stream-play-cdd.pages.dev` and localhost.

### 4. Run migrations

After the D1 database is created and `database_id` is set in `wrangler.toml`, run migrations:

**Local (for `wrangler dev`):**

```bash
npm run db:local
```

**Remote (for deployed worker):**

```bash
npm run db:remote
```

`db:remote` uses the `--remote` flag so migrations apply to your Cloudflare D1 database, not the local one.

### 5. Configure secrets and vars

**Note:** Variables must be **defined in the `[vars]` section of wrangler.toml** for the Worker to use them. Values set only in the Cloudflare Dashboard will not take effect unless the variable names are also declared in wrangler.toml (Wrangler uses the config as source of truth on deploy).

In `wrangler.toml`, set:

- `GOOGLE_CLIENT_ID` – Google OAuth client ID  
- `CLOUDFLARE_ACCOUNT_ID` – Your Cloudflare account ID  
- `database_id` – From step 2  

Then set secrets:

```bash
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET
wrangler secret put CLOUDFLARE_STREAM_API_TOKEN
```

For presigned video upload URLs (client uploads directly to R2):

```bash
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
```

Create R2 API tokens in the Cloudflare dashboard (R2 → Manage R2 API Tokens). Use the same account and bucket name as in `wrangler.toml` (`R2_BUCKET_NAME` / `video-uploads`).

**R2_PUBLIC_URL (required for playback_url):** Base URL for public access to your R2 bucket. Without it, `GET /videos/:id` returns `playback_url: null`. Set this after enabling public access on your bucket:
- **r2.dev (dev only):** R2 → bucket → Settings → Public Development URL → Enable, then copy the Public Bucket URL.
- **Custom domain (production):** R2 → bucket → Settings → Custom Domains → Add subdomain (e.g. `videos.yourdomain.com`).

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Local dev server (`wrangler dev`) |
| `npm run build` | Type-check + Worker bundle check (`tsc --noEmit` then `wrangler deploy --dry-run`). Use as CI build command. |
| `npm run deploy` | Deploy to Cloudflare Workers   |
| `npm run db:local`  | Run D1 migrations (local)  |
| `npm run db:remote` | Run D1 migrations (remote) |
| `npm run r2:cors` | Apply R2 CORS policy from `r2-cors.json` to bucket `video-uploads` |

## API Overview

### Auth

- **POST /auth/google** – Body: `{ "id_token": "..." }`. Returns `{ token, user }`.  
- **GET /auth/me** – Header: `Authorization: Bearer <token>`. Returns current user.

### Videos

- **POST /videos/upload-url** – Body: `{ "file_name", "content_type" }`. Returns `{ upload_url, video_key }`. Client uploads with `PUT upload_url` (binary body), then creates record with **POST /videos**.  
- **POST /videos** – Body: `{ title, description?, video_key, visibility? }`. Creates video record.  
- **GET /videos/:id** – Video details and `playback_url` (if `R2_PUBLIC_URL` is set). Private videos require auth.  
- **GET /videos** – List current user’s videos. Query: `?visibility=public|private|unlisted`.

### Streams

- **POST /streams** – Body: `{ title, description? }`. Returns `{ id, rtmp_url, stream_key, ... }`.  
- **POST /streams/:id/start** – Mark stream as live.  
- **POST /streams/:id/end** – End stream; returns `recording_url` when available.  
- **GET /streams/:id** – Stream details (auth required).  
- **GET /streams/:id/playback** – Returns `{ hls_url, dash_url, embed_url }` for playback.

### Health

- **GET /health** – `{ status: "ok", timestamp }`.

## Local development

```bash
npm run dev
```

Default base URL: `http://localhost:8787`.

## Deployment

```bash
npm run deploy
```

## Documentation

See `claude.md` in the repo for full API specs, examples, and implementation notes.
