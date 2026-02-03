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

CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
