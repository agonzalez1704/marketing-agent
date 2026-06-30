-- Client brand identity (tone, colors, audience, keywords…) inferred after scrape.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS identity JSONB;

-- Allow image- and video-derived assets.
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_origin_check;
ALTER TABLE assets ADD CONSTRAINT assets_origin_check
  CHECK (origin IN ('WEBSITE_URL', 'PDF_FILE', 'MANUAL', 'IMAGE', 'VIDEO'));
