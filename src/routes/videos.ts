import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { createPresignedUploadUrl, getR2PublicUrl } from '../services/r2';
import { jsonUnauthorized, jsonForbidden, jsonError, jsonNotFound } from '../utils/response';
import type { Bindings } from '../types';
import type { AuthVariables } from '../middleware/auth';

const videos = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

videos.post('/upload-url', authMiddleware, async (c) => {
  try {
    const body = await c.req.json<{ file_name: string; content_type?: string }>();
    const { file_name, content_type } = body;
    if (!file_name) {
      return c.json({ error: 'file_name is required' }, 400);
    }

    const videoKey = `${uuidv4()}-${file_name}`;
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = c.env.R2_BUCKET_NAME ?? 'video-uploads';

    if (!c.env.R2_ACCESS_KEY_ID || !c.env.R2_SECRET_ACCESS_KEY) {
      return c.json(
        {
          error:
            'R2 API credentials not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY secrets for presigned upload URLs.',
        },
        503
      );
    }

    const uploadUrl = await createPresignedUploadUrl({
      accountId,
      bucketName,
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
      videoKey,
      contentType: content_type ?? 'video/mp4',
    });
    return c.json({
      upload_url: uploadUrl,
      video_key: videoKey,
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    return jsonError(c, 'Failed to generate upload URL', 500);
  }
});

videos.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<{
      title: string;
      description?: string;
      video_key: string;
      visibility?: 'public' | 'private' | 'unlisted';
    }>();
    const { title, description, video_key, visibility = 'private' } = body;
    if (!title || !video_key) {
      return c.json({ error: 'title and video_key are required' }, 400);
    }

    const id = uuidv4();
    const created_at = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO videos (id, title, description, video_key, visibility, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, title, description ?? null, video_key, visibility, userId, created_at)
      .run();

    const row = await c.env.DB.prepare(
      'SELECT id, title, description, video_key, visibility, user_id, created_at FROM videos WHERE id = ?'
    )
      .bind(id)
      .first();
    return c.json(row, 201);
  } catch (error) {
    console.error('Create video error:', error);
    return jsonError(c, 'Failed to create video', 500);
  }
});

videos.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?')
      .bind(id)
      .first<{
        id: string;
        title: string;
        description: string | null;
        video_key: string;
        visibility: string;
        user_id: string;
        thumbnail_url: string | null;
        duration: number | null;
        file_size: number | null;
        created_at: string;
        updated_at: string | null;
      }>();

    if (!video) {
      return jsonNotFound(c, 'Video not found');
    }

    if (video.visibility === 'private') {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return jsonUnauthorized(c);
      }
      try {
        const token = authHeader.substring(7);
        const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as { userId: string };
        if (payload.userId !== video.user_id) {
          return jsonForbidden(c);
        }
      } catch {
        return jsonUnauthorized(c);
      }
    }

    const playbackUrl = getR2PublicUrl(c.env.R2_PUBLIC_URL, video.video_key);

    return c.json({
      ...video,
      playback_url: playbackUrl,
    });
  } catch (error) {
    console.error('Get video error:', error);
    return jsonError(c, 'Failed to get video', 500);
  }
});

videos.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const visibility = c.req.query('visibility');

    let query = 'SELECT id, title, description, video_key, visibility, user_id, thumbnail_url, created_at FROM videos WHERE user_id = ?';
    const params: (string | number)[] = [userId];
    if (visibility) {
      query += ' AND visibility = ?';
      params.push(visibility);
    }
    query += ' ORDER BY created_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ videos: result.results });
  } catch (error) {
    console.error('Get videos error:', error);
    return jsonError(c, 'Failed to get videos', 500);
  }
});

export default videos;
