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

CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON videos(visibility);
