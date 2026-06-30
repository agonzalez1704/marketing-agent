-- Add GOOGLEBUSINESS (Google Business Profile) to the supported platforms.
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('INSTAGRAM','FACEBOOK','LINKEDIN','TWITTER','PINTEREST','TIKTOK','YOUTUBE','GOOGLEBUSINESS'));

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_platform_check;
ALTER TABLE posts ADD CONSTRAINT posts_platform_check
  CHECK (platform IN ('INSTAGRAM','FACEBOOK','LINKEDIN','TWITTER','PINTEREST','TIKTOK','YOUTUBE','GOOGLEBUSINESS'));
