-- Allow 'MANUAL' assets (content written from scratch / a brief, no URL or PDF).
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_origin_check;
ALTER TABLE assets ADD CONSTRAINT assets_origin_check
  CHECK (origin IN ('WEBSITE_URL', 'PDF_FILE', 'MANUAL'));
