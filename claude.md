# Video REST APIs for Cloudflare Worker Project

## Project Overview
Build a video upload and streaming platform using Hono framework deployed on Cloudflare Workers. This project provides a lightweight, edge-computing solution for managing video uploads to R2 storage and live streaming capabilities with minimal latency.

## Tech Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework for edge computing)
- **Language**: TypeScript
- **Storage**: Cloudflare R2 (video file storage)
- **Streaming**: Cloudflare Stream (live streaming)
- **Database**: Cloudflare D1 (metadata storage)
- **Authentication**: Google OAuth
- **Deployment**: Wrangler CLI

## Project Structure
```
project-root/
├── src/
│   ├── index.ts           # Main entry point
│   ├── routes/            # API route handlers
│   │   ├── auth.ts        # Authentication endpoints
│   │   ├── videos.ts      # Video management endpoints
│   │   └── streams.ts     # Live streaming endpoints
│   ├── middleware/        # Custom middleware
│   │   ├── auth.ts        # JWT authentication middleware
│   │   └── logger.ts      # Request logging
│   ├── services/          # Business logic
│   │   ├── r2.ts          # R2 storage operations
│   │   ├── stream.ts      # Cloudflare Stream operations
│   │   └── google-auth.ts # Google OAuth integration
│   ├── utils/             # Utility functions
│   │   ├── response.ts    # Standard response helpers
│   │   └── jwt.ts         # JWT token utilities
│   └── types/             # TypeScript type definitions
│       └── index.ts
├── wrangler.toml          # Cloudflare configuration
├── package.json
├── tsconfig.json
└── README.md
```

## REST API Endpoints

### 1. Authentication APIs

#### Google Login
- **POST** `/auth/google`
- **Description**: Authenticate user with Google OAuth
- **Request Body**:
  ```json
  {
    "id_token": "google_oauth_id_token"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt_access_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
  ```

#### Get Current User
- **GET** `/auth/me`
- **Description**: Get authenticated user information
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
  ```

### 2. Video APIs

#### Get Upload URL
- **POST** `/videos/upload-url`
- **Description**: Get presigned URL for uploading video to R2
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "file_name": "video.mp4",
    "content_type": "video/mp4"
  }
  ```
- **Response**:
  ```json
  {
    "upload_url": "https://r2-presigned-url",
    "video_key": "unique-video-key"
  }
  ```

#### Upload to R2
- **PUT** `{upload_url}`
- **Description**: Upload video file directly to R2 using presigned URL (client-side)
- **Headers**: `Content-Type: video/mp4`
- **Body**: Binary video file data
- **Note**: This is done client-side, not through the API server

#### Create Video Record
- **POST** `/videos`
- **Description**: Create video metadata record after successful upload
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "title": "My Video",
    "description": "Video description",
    "video_key": "unique-video-key",
    "visibility": "public"
  }
  ```
- **Response**:
  ```json
  {
    "id": "video_id",
    "title": "My Video",
    "description": "Video description",
    "video_key": "unique-video-key",
    "visibility": "public",
    "user_id": "user_id",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
  ```

#### Get Video by ID
- **GET** `/videos/:id`
- **Description**: Get video details and playback URL
- **Headers**: `Authorization: Bearer {token}` (optional, depends on visibility)
- **Response**:
  ```json
  {
    "id": "video_id",
    "title": "My Video",
    "description": "Video description",
    "playback_url": "https://r2-public-url/video.mp4",
    "visibility": "public",
    "user_id": "user_id",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
  ```

#### Get All Videos
- **GET** `/videos`
- **Description**: Get list of user's videos or public videos
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: `?visibility=public` (optional)
- **Response**:
  ```json
  {
    "videos": [
      {
        "id": "video_id",
        "title": "My Video",
        "description": "Video description",
        "thumbnail_url": "https://thumbnail-url",
        "visibility": "public",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### 3. Stream APIs

#### Create Stream
- **POST** `/streams`
- **Description**: Create a new live stream session
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "title": "My Live Stream",
    "description": "Stream description"
  }
  ```
- **Response**:
  ```json
  {
    "id": "stream_id",
    "title": "My Live Stream",
    "description": "Stream description",
    "rtmp_url": "rtmps://live.cloudflare.com/live/",
    "stream_key": "stream_key_secret",
    "status": "idle",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
  ```

#### Start Stream
- **POST** `/streams/:id/start`
- **Description**: Start broadcasting a live stream
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "id": "stream_id",
    "status": "live",
    "started_at": "2024-01-01T00:00:00.000Z"
  }
  ```

#### End Stream
- **POST** `/streams/:id/end`
- **Description**: Stop broadcasting and end the stream
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "id": "stream_id",
    "status": "ended",
    "ended_at": "2024-01-01T00:00:00.000Z",
    "recording_url": "https://recording-url"
  }
  ```

#### Get Stream Details
- **GET** `/streams/:id`
- **Description**: Get stream information and status
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "id": "stream_id",
    "title": "My Live Stream",
    "description": "Stream description",
    "status": "live",
    "viewer_count": 42,
    "started_at": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
  ```

#### Get Playback URL
- **GET** `/streams/:id/playback`
- **Description**: Get HLS/DASH playback URLs for viewing stream
- **Response**:
  ```json
  {
    "hls_url": "https://customer-stream.cloudflarestream.com/stream-id/manifest/video.m3u8",
    "dash_url": "https://customer-stream.cloudflarestream.com/stream-id/manifest/video.mpd",
    "embed_url": "https://customer-stream.cloudflarestream.com/stream-id/iframe"
  }
  ```

## Authentication Flow

This project uses **Google OAuth 2.0** for user authentication combined with **JWT (JSON Web Tokens)** for session management. The flow separates initial authentication (via Google) from subsequent API authorization (via JWT).

### Authentication Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Worker API │         │ Google OAuth │
│  (Browser)   │         │   (Hono)     │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

### Flow 1: Initial Login (Google OAuth → JWT)

**Endpoint:** `POST /auth/google`

```
1. Frontend initiates Google OAuth flow
   └─> User signs in with Google
   └─> Google returns ID token to frontend

2. Frontend sends ID token to API
   POST /auth/google
   Body: { "id_token": "eyJhbGc..." }

3. API verifies Google ID token
   └─> Calls Google's token verification API
   └─> Extracts user info (email, name, picture)

4. API checks/creates user in D1 database
   └─> SELECT user by email
   └─> If not exists: INSERT new user with UUID
   └─> Get userId

5. API creates JWT token
   └─> Payload: { userId, email, exp }
   └─> Sign with JWT_SECRET using HS256
   └─> Expiry: 7 days from creation

6. API returns JWT to frontend
   Response: {
     "token": "eyJhbGc...",
     "user": { "id", "email", "name" }
   }

7. Frontend stores JWT
   └─> localStorage/sessionStorage
   └─> Includes in all future requests
```

**Code References:**
- Handler: `src/routes/auth.ts` (lines 11-65)
- Google verification: `src/services/google-auth.ts`
- Token creation: `src/utils/jwt.ts` (lines 5-18)

### Flow 2: Protected API Requests (JWT Verification)

**Endpoints:** All routes using `authMiddleware` (videos, streams)

```
1. Frontend makes API request
   GET/POST /videos, /streams, etc.
   Headers: {
     "Authorization": "Bearer eyJhbGc..."
   }

2. authMiddleware intercepts request
   └─> Extracts token from Authorization header
   └─> Removes "Bearer " prefix

3. JWT verification
   └─> verify(token, JWT_SECRET, 'HS256')
   └─> Checks signature matches
   └─> Checks token not expired
   └─> Extracts payload { userId, email }

4. If valid:
   └─> Sets userId in request context: c.set('userId', payload.userId)
   └─> Proceeds to route handler
   └─> Handler can access userId via c.get('userId')

5. If invalid:
   └─> Returns 401 Unauthorized
   └─> Frontend should redirect to login
```

**Code References:**
- Middleware: `src/middleware/auth.ts` (lines 10-24)
- Token verification: `src/utils/jwt.ts` (lines 20-25)
- Usage: Applied to routes in `src/routes/videos.ts` and `src/routes/streams.ts`

### Flow 3: Get Current User

**Endpoint:** `GET /auth/me`

```
1. Frontend requests current user info
   GET /auth/me
   Headers: { "Authorization": "Bearer <token>" }

2. API verifies JWT (same as Flow 2)

3. API queries user from database
   └─> SELECT user WHERE id = payload.userId

4. Returns user data
   Response: {
     "id", "email", "name", "avatar_url", "created_at"
   }
```

**Code References:**
- Handler: `src/routes/auth.ts` (lines 67-90)

### JWT Security Details

| Property | Value |
|----------|-------|
| **Algorithm** | HS256 (HMAC with SHA-256) |
| **Secret** | `JWT_SECRET` environment variable (32+ char random string) |
| **Expiry** | 7 days (604,800 seconds) |
| **Payload** | `{ userId, email, exp }` |

**Token Lifecycle:**
```
Creation (Login)
    ↓
Valid for 7 days
    ↓
Expiry → 401 Unauthorized → Redirect to login
```

**Security Considerations:**
1. `JWT_SECRET` must remain constant — changing it invalidates all tokens
2. HTTPS required — tokens sent in headers must be encrypted in transit
3. No token refresh — users must re-login after 7 days
4. Stateless — no server-side session storage needed

### Authentication Error Handling

| Scenario | Response | Frontend Action |
|----------|----------|-----------------|
| Invalid Google ID token | 401 "Invalid token" | Show error, retry login |
| Missing Authorization header | 401 "Unauthorized" | Redirect to login |
| Invalid/expired JWT | 401 "Unauthorized" | Clear token, redirect to login |
| JWT signature mismatch | 401 "Unauthorized" | Clear token, redirect to login |
| User not found (after valid JWT) | 404 "User not found" | Clear token, redirect to login |

### Environment Variables for Authentication

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `GOOGLE_CLIENT_ID` | Verify Google ID tokens | `src/services/google-auth.ts` |
| `JWT_SECRET` | Sign/verify JWT tokens | `src/utils/jwt.ts`, `src/middleware/auth.ts` |

## Implementation Guide

### 1. Setup Dependencies
```bash
npm init -y
npm install hono
npm install google-auth-library uuid
npm install -D wrangler typescript @cloudflare/workers-types @types/uuid
```

### 2. Configure wrangler.toml
```toml
name = "video-streaming-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# R2 Bucket binding for video storage
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "video-uploads"

# D1 Database binding for metadata
[[d1_databases]]
binding = "DB"
database_name = "video_streaming_db"
database_id = "your-database-id"

# Environment variables
[vars]
GOOGLE_CLIENT_ID = "your-google-client-id"
CLOUDFLARE_ACCOUNT_ID = "your-account-id"

# Secrets (set via: wrangler secret put SECRET_NAME)
# GOOGLE_CLIENT_SECRET
# JWT_SECRET
# CLOUDFLARE_STREAM_API_TOKEN

[env.production]
name = "video-streaming-api-prod"
```

### 3. Main Entry Point (src/index.ts)
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import streamRoutes from './routes/streams';

type Bindings = {
  R2_BUCKET: R2Bucket;
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_STREAM_API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true,
}));
app.use('*', logger());

// Routes
app.route('/auth', authRoutes);
app.route('/videos', videoRoutes);
app.route('/streams', streamRoutes);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
```

### 4. Authentication Routes (src/routes/auth.ts)
```typescript
import { Hono } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import { sign, verify } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  JWT_SECRET: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Google Login
auth.post('/google', async (c) => {
  try {
    const { id_token } = await c.req.json();
    
    // Verify Google token
    const client = new OAuth2Client(c.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: c.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Check if user exists, create if not
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(payload.email).first();
    
    let userId;
    if (!existingUser) {
      const result = await c.env.DB.prepare(
        'INSERT INTO users (email, name, avatar_url) VALUES (?, ?, ?) RETURNING id'
      ).bind(payload.email, payload.name, payload.picture).first();
      userId = result.id;
    } else {
      userId = existingUser.id;
    }
    
    // Generate JWT
    const token = await sign(
      { userId, email: payload.email, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) },
      c.env.JWT_SECRET
    );
    
    return c.json({
      token,
      user: {
        id: userId,
        email: payload.email,
        name: payload.name,
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
});

// Get current user
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?'
    ).bind(payload.userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

export default auth;
```

### 5. Video Routes (src/routes/videos.ts)
```typescript
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { v4 as uuidv4 } from 'uuid';

type Bindings = {
  R2_BUCKET: R2Bucket;
  DB: D1Database;
  JWT_SECRET: string;
};

const videos = new Hono<{ Bindings: Bindings }>();

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('userId', payload.userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};

// Get upload URL
videos.post('/upload-url', authMiddleware, async (c) => {
  try {
    const { file_name, content_type } = await c.req.json();
    
    // Generate unique key for video
    const videoKey = `${uuidv4()}-${file_name}`;
    
    // Generate presigned URL for R2 upload
    const uploadUrl = await c.env.R2_BUCKET.createMultipartUpload(videoKey);
    
    return c.json({
      upload_url: uploadUrl,
      video_key: videoKey,
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    return c.json({ error: 'Failed to generate upload URL' }, 500);
  }
});

// Create video record
videos.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { title, description, video_key, visibility = 'private' } = await c.req.json();
    
    const result = await c.env.DB.prepare(`
      INSERT INTO videos (id, title, description, video_key, visibility, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      uuidv4(),
      title,
      description,
      video_key,
      visibility,
      userId,
      new Date().toISOString()
    ).first();
    
    return c.json(result, 201);
  } catch (error) {
    console.error('Create video error:', error);
    return c.json({ error: 'Failed to create video' }, 500);
  }
});

// Get video by ID
videos.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const video = await c.env.DB.prepare(
      'SELECT * FROM videos WHERE id = ?'
    ).bind(id).first();
    
    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }
    
    // Check if video is private and user is not authenticated
    if (video.visibility === 'private') {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      
      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);
      
      if (payload.userId !== video.user_id) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }
    
    // Generate playback URL from R2
    const object = await c.env.R2_BUCKET.get(video.video_key);
    const playbackUrl = object ? `https://your-r2-domain/${video.video_key}` : null;
    
    return c.json({
      ...video,
      playback_url: playbackUrl,
    });
  } catch (error) {
    console.error('Get video error:', error);
    return c.json({ error: 'Failed to get video' }, 500);
  }
});

// Get all videos
videos.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const visibility = c.req.query('visibility');
    
    let query = 'SELECT * FROM videos WHERE user_id = ?';
    const params = [userId];
    
    if (visibility) {
      query += ' AND visibility = ?';
      params.push(visibility);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({ videos: result.results });
  } catch (error) {
    console.error('Get videos error:', error);
    return c.json({ error: 'Failed to get videos' }, 500);
  }
});

export default videos;
```

### 6. Stream Routes (src/routes/streams.ts)
```typescript
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { v4 as uuidv4 } from 'uuid';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_STREAM_API_TOKEN: string;
};

const streams = new Hono<{ Bindings: Bindings }>();

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('userId', payload.userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};

// Create stream
streams.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { title, description } = await c.req.json();
    
    // Create live input in Cloudflare Stream
    const streamResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CLOUDFLARE_STREAM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta: { name: title },
          recording: { mode: 'automatic' },
        }),
      }
    );
    
    const streamData = await streamResponse.json();
    
    if (!streamResponse.ok) {
      throw new Error('Failed to create stream');
    }
    
    const streamId = uuidv4();
    
    // Save to database
    await c.env.DB.prepare(`
      INSERT INTO streams (id, title, description, cf_stream_id, rtmp_url, stream_key, status, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      streamId,
      title,
      description || '',
      streamData.result.uid,
      streamData.result.rtmps.url,
      streamData.result.rtmps.streamKey,
      'idle',
      userId,
      new Date().toISOString()
    ).run();
    
    return c.json({
      id: streamId,
      title,
      description,
      rtmp_url: streamData.result.rtmps.url,
      stream_key: streamData.result.rtmps.streamKey,
      status: 'idle',
      created_at: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('Create stream error:', error);
    return c.json({ error: 'Failed to create stream' }, 500);
  }
});

// Start stream
streams.post('/:id/start', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    
    const stream = await c.env.DB.prepare(
      'SELECT * FROM streams WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (!stream) {
      return c.json({ error: 'Stream not found' }, 404);
    }
    
    await c.env.DB.prepare(
      'UPDATE streams SET status = ?, started_at = ? WHERE id = ?'
    ).bind('live', new Date().toISOString(), id).run();
    
    return c.json({
      id,
      status: 'live',
      started_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Start stream error:', error);
    return c.json({ error: 'Failed to start stream' }, 500);
  }
});

// End stream
streams.post('/:id/end', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    
    const stream = await c.env.DB.prepare(
      'SELECT * FROM streams WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (!stream) {
      return c.json({ error: 'Stream not found' }, 404);
    }
    
    await c.env.DB.prepare(
      'UPDATE streams SET status = ?, ended_at = ? WHERE id = ?'
    ).bind('ended', new Date().toISOString(), id).run();
    
    // Get recording URL from Cloudflare Stream
    const recordingResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${stream.cf_stream_id}/videos`,
      {
        headers: {
          'Authorization': `Bearer ${c.env.CLOUDFLARE_STREAM_API_TOKEN}`,
        },
      }
    );
    
    const recordingData = await recordingResponse.json();
    const recordingUrl = recordingData.result?.[0]?.playback?.hls || null;
    
    return c.json({
      id,
      status: 'ended',
      ended_at: new Date().toISOString(),
      recording_url: recordingUrl,
    });
  } catch (error) {
    console.error('End stream error:', error);
    return c.json({ error: 'Failed to end stream' }, 500);
  }
});

// Get stream
streams.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    
    const stream = await c.env.DB.prepare(
      'SELECT * FROM streams WHERE id = ?'
    ).bind(id).first();
    
    if (!stream) {
      return c.json({ error: 'Stream not found' }, 404);
    }
    
    return c.json(stream);
  } catch (error) {
    console.error('Get stream error:', error);
    return c.json({ error: 'Failed to get stream' }, 500);
  }
});

// Get playback URL
streams.get('/:id/playback', async (c) => {
  try {
    const id = c.req.param('id');
    
    const stream = await c.env.DB.prepare(
      'SELECT * FROM streams WHERE id = ?'
    ).bind(id).first();
    
    if (!stream) {
      return c.json({ error: 'Stream not found' }, 404);
    }
    
    // Get playback info from Cloudflare Stream
    const playbackResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${stream.cf_stream_id}`,
      {
        headers: {
          'Authorization': `Bearer ${c.env.CLOUDFLARE_STREAM_API_TOKEN}`,
        },
      }
    );
    
    const playbackData = await playbackResponse.json();
    
    return c.json({
      hls_url: playbackData.result?.playback?.hls,
      dash_url: playbackData.result?.playback?.dash,
      embed_url: `https://customer-${c.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${stream.cf_stream_id}/iframe`,
    });
  } catch (error) {
    console.error('Get playback URL error:', error);
    return c.json({ error: 'Failed to get playback URL' }, 500);
  }
});

export default streams;
```

### 7. TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Database Schema (D1)

### Create Database:

Create the D1 database first (required before running migrations):

```bash
npx wrangler d1 create video_streaming_db
```

The command outputs a `[[d1_databases]]` block with a `database_id` (UUID). Copy that block into `wrangler.toml`, or copy only the `database_id` value into the existing `[[d1_databases]]` section. Without a valid `database_id`, remote migrations will fail with an "Invalid uuid" error.

### Database Migrations:

#### Users Table:
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

#### Videos Table:
```sql
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_key TEXT NOT NULL,
  visibility TEXT DEFAULT 'private' CHECK(visibility IN ('public', 'private', 'unlisted')),
  user_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  file_size INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_visibility ON videos(visibility);
```

#### Streams Table:
```sql
CREATE TABLE IF NOT EXISTS streams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cf_stream_id TEXT NOT NULL,
  rtmp_url TEXT NOT NULL,
  stream_key TEXT NOT NULL,
  status TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'live', 'ended')),
  user_id TEXT NOT NULL,
  viewer_count INTEGER DEFAULT 0,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_streams_user_id ON streams(user_id);
CREATE INDEX idx_streams_status ON streams(status);
```

### Run Migrations:

Ensure the D1 database is created and `database_id` is set in `wrangler.toml` (see Create Database above). Then:

```bash
# Local development (npm run db:local)
wrangler d1 execute video_streaming_db --local --file=./migrations/001_create_users.sql
wrangler d1 execute video_streaming_db --local --file=./migrations/002_create_videos.sql
wrangler d1 execute video_streaming_db --local --file=./migrations/003_create_streams.sql

# Production / remote (npm run db:remote) — use --remote so migrations run on Cloudflare D1
wrangler d1 execute video_streaming_db --remote --file=./migrations/001_create_users.sql
wrangler d1 execute video_streaming_db --remote --file=./migrations/002_create_videos.sql
wrangler d1 execute video_streaming_db --remote --file=./migrations/003_create_streams.sql
```

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
# or
wrangler dev
```

### Deployment
```bash
# Deploy to Cloudflare Workers
npm run deploy
# or
wrangler deploy
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest"
  }
}
```

## Environment Variables & Secrets

### Set in wrangler.toml (Public):
```toml
[vars]
GOOGLE_CLIENT_ID = "your-google-oauth-client-id"
CLOUDFLARE_ACCOUNT_ID = "your-cloudflare-account-id"
```

### Set via Wrangler CLI (Secrets):
```bash
# Google OAuth
wrangler secret put GOOGLE_CLIENT_SECRET

# JWT Authentication
wrangler secret put JWT_SECRET

# Cloudflare Stream API
wrangler secret put CLOUDFLARE_STREAM_API_TOKEN
```

### Access in Code:
```typescript
const googleClientId = c.env.GOOGLE_CLIENT_ID;
const jwtSecret = c.env.JWT_SECRET;
const r2Bucket = c.env.R2_BUCKET;
const db = c.env.DB;
```

## API Testing Examples

### 1. Test Google Authentication:
```bash
# This would be done through OAuth flow in browser
# After getting id_token from Google, test login:
curl -X POST http://localhost:8787/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "YOUR_GOOGLE_ID_TOKEN"}'

# Response: {"token": "JWT_TOKEN", "user": {...}}
```

### 2. Test Get Current User:
```bash
curl -X GET http://localhost:8787/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Video Upload Flow:
```bash
# Step 1: Get upload URL
curl -X POST http://localhost:8787/videos/upload-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"file_name": "my-video.mp4", "content_type": "video/mp4"}'

# Response: {"upload_url": "...", "video_key": "..."}

# Step 2: Upload video to R2 (client-side)
curl -X PUT "PRESIGNED_UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  --data-binary @my-video.mp4

# Step 3: Create video record
curl -X POST http://localhost:8787/videos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Video",
    "description": "A great video",
    "video_key": "VIDEO_KEY_FROM_STEP_1",
    "visibility": "public"
  }'
```

### 4. Test Stream Creation:
```bash
# Create stream
curl -X POST http://localhost:8787/streams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Live Stream", "description": "Going live!"}'

# Response includes RTMPS URL and stream key for OBS
```

### 5. Test with OBS Studio:
```
1. Open OBS Studio
2. Go to Settings > Stream
3. Service: Custom
4. Server: [rtmp_url from API response]
5. Stream Key: [stream_key from API response]
6. Start Streaming in OBS
7. Call POST /streams/:id/start to mark as live
```

## Best Practices

1. **Security**:
   - Validate JWT tokens on all protected endpoints
   - Use presigned URLs for direct R2 uploads (avoid proxying through worker)
   - Sanitize user inputs to prevent SQL injection
   - Implement rate limiting per user/IP
   - Use HTTPS only for all endpoints

2. **Performance**:
   - Use R2 presigned URLs for client-side uploads
   - Cache video metadata in KV for faster access
   - Implement pagination for video listings
   - Use Cloudflare Stream for adaptive bitrate streaming
   - Optimize database queries with proper indexes

3. **Video Processing**:
   - Validate video file types and sizes before upload
   - Generate thumbnails using Cloudflare Stream
   - Implement video transcoding through Stream
   - Handle upload progress on client-side
   - Clean up failed uploads from R2

4. **Streaming**:
   - Use RTMPS for secure stream ingestion
   - Monitor stream health and viewer count
   - Implement automatic recording
   - Handle stream reconnection gracefully
   - Set appropriate buffer sizes

5. **Error Handling**:
   - Implement proper error responses with status codes
   - Log errors for debugging
   - Handle R2 upload failures gracefully
   - Validate file uploads before processing
   - Return user-friendly error messages

6. **Authentication**:
   - Implement token refresh mechanism
   - Set appropriate JWT expiration times
   - Store tokens securely on client-side
   - Handle expired tokens gracefully
   - Support multiple OAuth providers

7. **Database**:
   - Use transactions for data consistency
   - Implement soft deletes for videos
   - Track video analytics (views, duration)
   - Regular backups of D1 database
   - Optimize queries with indexes

## Additional Features to Consider

### Storage & Media:
- **R2 Multipart Uploads**: Support large video files (>100MB)
- **Video Thumbnails**: Auto-generate from Cloudflare Stream
- **Video Transcoding**: Multiple quality options (360p, 720p, 1080p)
- **Subtitle Support**: Upload and serve VTT/SRT files
- **Image Processing**: Thumbnail generation and optimization

### Streaming Features:
- **Live Chat**: Integrate with Durable Objects for real-time chat
- **Stream Recording**: Auto-save live streams for VOD
- **Multiple Bitrates**: Adaptive streaming quality
- **Stream Analytics**: Viewer count, watch time, engagement
- **Stream Scheduling**: Schedule future live streams

### User Features:
- **User Profiles**: Public profile pages with videos
- **Playlists**: Create and manage video playlists
- **Video Comments**: Comment system with moderation
- **Likes & Reactions**: Video engagement features
- **Subscriptions**: Follow other creators
- **Notifications**: Email/push for new uploads

### Content Management:
- **Video Editing**: Basic trim, crop functionality
- **Batch Operations**: Bulk video management
- **Categories & Tags**: Organize videos
- **Search & Filters**: Full-text search with filters
- **Content Moderation**: Automated content scanning

### Analytics & Monitoring:
- **Video Analytics**: Views, watch time, engagement
- **Stream Metrics**: Concurrent viewers, peak times
- **User Analytics**: User behavior tracking
- **Performance Monitoring**: API response times
- **Error Tracking**: Sentry or similar integration

### Monetization:
- **Subscriptions**: Paid content access
- **Pay-per-view**: Individual video purchases
- **Ads Integration**: Pre-roll/mid-roll ads
- **Donations**: Tip creators during streams
- **Membership Tiers**: Different access levels

## Deployment Checklist

### Pre-deployment:
- [ ] Test all API endpoints locally with Wrangler
- [ ] Test video upload flow end-to-end
- [ ] Test live streaming with RTMPS client (OBS/FFmpeg)
- [ ] Verify Google OAuth integration
- [ ] Test JWT authentication and token refresh

### Configuration:
- [ ] Set up R2 bucket for video storage
- [ ] Create D1 database and run migrations
- [ ] Configure Cloudflare Stream account
- [ ] Set all environment variables and secrets
- [ ] Configure CORS for your frontend domain
- [ ] Set up custom domain (optional)

### Security:
- [ ] Enable security headers (CSP, HSTS, etc.)
- [ ] Configure rate limiting per endpoint
- [ ] Set up API key rotation policy
- [ ] Review file upload size limits
- [ ] Implement content validation

### Monitoring:
- [ ] Set up Cloudflare Analytics
- [ ] Configure error logging
- [ ] Set up uptime monitoring
- [ ] Create alerts for API failures
- [ ] Monitor R2 storage usage

### Documentation:
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Create integration guide for frontend
- [ ] Document RTMPS setup for streamers
- [ ] Prepare user guides for video upload
- [ ] Document environment setup

### Performance:
- [ ] Test with large video files (1GB+)
- [ ] Verify concurrent stream handling
- [ ] Check database query performance
- [ ] Test R2 upload/download speeds
- [ ] Monitor Worker CPU time limits

### Cost Management:
- [ ] Review Cloudflare Workers pricing
- [ ] Calculate R2 storage costs
- [ ] Estimate Cloudflare Stream costs
- [ ] Set up billing alerts
- [ ] Plan for scaling costs

## Resources

### Cloudflare Documentation:
- [Hono Framework](https://hono.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Storage](https://developers.cloudflare.com/r2/)
- [Cloudflare Stream](https://developers.cloudflare.com/stream/)
- [Cloudflare D1 Database](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Authentication & Security:
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Hono JWT Middleware](https://hono.dev/middleware/builtin/jwt)

### Video & Streaming:
- [RTMPS Protocol](https://en.wikipedia.org/wiki/Real-Time_Messaging_Protocol)
- [HLS Streaming](https://developer.apple.com/streaming/)
- [DASH Streaming](https://dashif.org/)
- [OBS Studio](https://obsproject.com/) - For testing live streams
- [FFmpeg](https://ffmpeg.org/) - Video processing tools

### Example Tools for Testing:
- **Postman/Insomnia**: API testing
- **OBS Studio**: RTMPS streaming client
- **VLC Player**: Test HLS/DASH playback
- **curl/httpie**: Command-line API testing
