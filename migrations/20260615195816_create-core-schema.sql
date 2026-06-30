-- Marketing Agent core schema.
-- 4 tables. Single operator, no auth: all access is server-side via the admin
-- (api_key) client which bypasses RLS. RLS is enabled with no policies so anon /
-- authenticated callers are denied by default.

-- clients: one client == one LATE profile (late_profile_id), the isolation key.
CREATE TABLE clients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  logo_url         TEXT,
  late_profile_id  TEXT NOT NULL UNIQUE,
  default_goal     TEXT,
  default_audience TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- social_accounts: cache of a client's LATE-connected accounts.
CREATE TABLE social_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('INSTAGRAM','FACEBOOK','LINKEDIN','TWITTER','PINTEREST','TIKTOK','YOUTUBE')),
  username        TEXT,
  late_account_id TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'CONNECTED' CHECK (status IN ('CONNECTED','CONNECTING','DISCONNECTED','ERROR')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, late_account_id)
);
CREATE INDEX idx_social_accounts_client ON social_accounts(client_id);

-- assets: scraped/parsed source content (URL or PDF) from the n8n webhooks.
CREATE TABLE assets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  source     TEXT NOT NULL,
  origin     TEXT NOT NULL CHECK (origin IN ('WEBSITE_URL','PDF_FILE')),
  text       TEXT,
  images     JSONB NOT NULL DEFAULT '[]',
  videos     JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assets_client ON assets(client_id);

-- posts: one generated post per platform.
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asset_id      UUID REFERENCES assets(id) ON DELETE SET NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('INSTAGRAM','FACEBOOK','LINKEDIN','TWITTER','PINTEREST','TIKTOK','YOUTUBE')),
  content       TEXT NOT NULL,
  media_urls    JSONB NOT NULL DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','PUBLISHING','PUBLISHED','FAILED')),
  scheduled_for TIMESTAMPTZ,
  late_post_id  TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_posts_client_status ON posts(client_id, status);
CREATE INDEX idx_posts_scheduled_for ON posts(scheduled_for);

-- Enable RLS (no policies => only the admin api_key client can read/write).
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on every UPDATE.
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER social_accounts_updated_at BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
