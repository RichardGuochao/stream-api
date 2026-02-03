import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import {
  createLiveInput,
  getLiveInput,
  getLiveInputVideos,
} from '../services/stream';
import { jsonError, jsonNotFound } from '../utils/response';
import type { Bindings } from '../types';
import type { AuthVariables } from '../middleware/auth';

const streams = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

streams.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<{ title: string; description?: string }>();
    const { title, description } = body;
    if (!title) {
      return c.json({ error: 'title is required' }, 400);
    }

    const apiToken = c.env.CLOUDFLARE_STREAM_API_TOKEN;
    if (!apiToken) {
      return c.json({ error: 'Stream API not configured' }, 503);
    }

    const streamData = await createLiveInput(
      c.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken,
      title,
      'automatic'
    );

    const result = streamData.result;
    if (!result?.rtmps?.url || !result?.rtmps?.streamKey) {
      console.error('Stream API response:', streamData);
      return jsonError(c, 'Failed to create stream', 500);
    }

    const id = uuidv4();
    const created_at = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO streams (id, title, description, cf_stream_id, rtmp_url, stream_key, status, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        title,
        description ?? '',
        result.uid,
        result.rtmps.url,
        result.rtmps.streamKey,
        'idle',
        userId,
        created_at
      )
      .run();

    return c.json(
      {
        id,
        title,
        description: description ?? '',
        rtmp_url: result.rtmps.url,
        stream_key: result.rtmps.streamKey,
        status: 'idle',
        created_at,
      },
      201
    );
  } catch (error) {
    console.error('Create stream error:', error);
    return jsonError(c, 'Failed to create stream', 500);
  }
});

streams.post('/:id/start', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');

    const stream = await c.env.DB.prepare(
      'SELECT id FROM streams WHERE id = ? AND user_id = ?'
    )
      .bind(id, userId)
      .first();

    if (!stream) {
      return jsonNotFound(c, 'Stream not found');
    }

    const started_at = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE streams SET status = ?, started_at = ? WHERE id = ?'
    )
      .bind('live', started_at, id)
      .run();

    return c.json({
      id,
      status: 'live',
      started_at,
    });
  } catch (error) {
    console.error('Start stream error:', error);
    return jsonError(c, 'Failed to start stream', 500);
  }
});

streams.post('/:id/end', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');

    const stream = await c.env.DB.prepare(
      'SELECT id, cf_stream_id FROM streams WHERE id = ? AND user_id = ?'
    )
      .bind(id, userId)
      .first<{ id: string; cf_stream_id: string }>();

    if (!stream) {
      return jsonNotFound(c, 'Stream not found');
    }

    const ended_at = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE streams SET status = ?, ended_at = ? WHERE id = ?'
    )
      .bind('ended', ended_at, id)
      .run();

    let recordingUrl: string | null = null;
    const apiToken = c.env.CLOUDFLARE_STREAM_API_TOKEN;
    if (apiToken) {
      const recordingData = await getLiveInputVideos(
        c.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken,
        stream.cf_stream_id
      );
      recordingUrl = recordingData.result?.[0]?.playback?.hls ?? null;
    }

    return c.json({
      id,
      status: 'ended',
      ended_at,
      recording_url: recordingUrl,
    });
  } catch (error) {
    console.error('End stream error:', error);
    return jsonError(c, 'Failed to end stream', 500);
  }
});

streams.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const stream = await c.env.DB.prepare('SELECT * FROM streams WHERE id = ?')
      .bind(id)
      .first();

    if (!stream) {
      return jsonNotFound(c, 'Stream not found');
    }

    return c.json(stream);
  } catch (error) {
    console.error('Get stream error:', error);
    return jsonError(c, 'Failed to get stream', 500);
  }
});

streams.get('/:id/playback', async (c) => {
  try {
    const id = c.req.param('id');
    const stream = await c.env.DB.prepare(
      'SELECT cf_stream_id FROM streams WHERE id = ?'
    )
      .bind(id)
      .first<{ cf_stream_id: string }>();

    if (!stream) {
      return jsonNotFound(c, 'Stream not found');
    }

    const apiToken = c.env.CLOUDFLARE_STREAM_API_TOKEN;
    if (!apiToken) {
      return c.json({
        hls_url: null,
        dash_url: null,
        embed_url: `https://customer-${c.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${stream.cf_stream_id}/iframe`,
        message: 'Playback URLs require CLOUDFLARE_STREAM_API_TOKEN',
      });
    }

    const playbackData = await getLiveInput(
      c.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken,
      stream.cf_stream_id
    );
    const result = playbackData.result;

    return c.json({
      hls_url: result?.playback?.hls ?? null,
      dash_url: result?.playback?.dash ?? null,
      embed_url: `https://customer-${c.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${stream.cf_stream_id}/iframe`,
    });
  } catch (error) {
    console.error('Get playback URL error:', error);
    return jsonError(c, 'Failed to get playback URL', 500);
  }
});

export default streams;
