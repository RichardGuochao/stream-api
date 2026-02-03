export type Visibility = 'public' | 'private' | 'unlisted';
export type StreamStatus = 'idle' | 'live' | 'ended';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  video_key: string;
  visibility: Visibility;
  user_id: string;
  thumbnail_url: string | null;
  duration: number | null;
  file_size: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface Stream {
  id: string;
  title: string;
  description: string | null;
  cf_stream_id: string;
  rtmp_url: string;
  stream_key: string;
  status: StreamStatus;
  user_id: string;
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Bindings {
  R2_BUCKET: R2Bucket;
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET?: string;
  JWT_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_STREAM_API_TOKEN?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_URL?: string;
  /** Comma-separated list of allowed CORS origins (e.g. your Cloudflare Pages frontend URL) */
  CORS_ORIGINS?: string;
}
