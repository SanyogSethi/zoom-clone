-- Enable Foreign Key enforcement in SQLite
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meeting_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('instant','scheduled')),
  scheduled_start TEXT,
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (type = 'instant' OR (scheduled_start IS NOT NULL AND duration_minutes IS NOT NULL))
);

-- Meeting Sessions table
CREATE TABLE IF NOT EXISTS meeting_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host','participant')),
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined','left','removed')),
  is_muted INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_meetings_host_start  ON meetings(host_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_sessions_meeting     ON meeting_sessions(meeting_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id, status);
CREATE INDEX IF NOT EXISTS idx_participants_user    ON participants(user_id, status, left_at);
