import type { Platform } from "@/lib/types"

export interface PlatformMeta {
  key: Platform
  label: string
  color: string // brand color for the dot/badge
}

// The platforms the mini app supports (subset LATE handles).
export const PLATFORMS: PlatformMeta[] = [
  { key: "INSTAGRAM", label: "Instagram", color: "#E1306C" },
  { key: "FACEBOOK", label: "Facebook", color: "#1877F2" },
  { key: "LINKEDIN", label: "LinkedIn", color: "#0A66C2" },
  { key: "TWITTER", label: "X (Twitter)", color: "#000000" },
  { key: "PINTEREST", label: "Pinterest", color: "#E60023" },
  { key: "TIKTOK", label: "TikTok", color: "#010101" },
  { key: "YOUTUBE", label: "YouTube", color: "#FF0000" },
  { key: "GOOGLEBUSINESS", label: "Google Business", color: "#4285F4" },
]

export const PLATFORM_LABEL: Record<Platform, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.label]),
) as Record<Platform, string>

export const PLATFORM_COLOR: Record<Platform, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.color]),
) as Record<Platform, string>

// Per-platform copy length caps (client-safe so editors can validate live).
export const PLATFORM_CHAR_LIMIT: Record<Platform, number> = {
  TWITTER: 280,
  INSTAGRAM: 2200,
  FACEBOOK: 5000,
  LINKEDIN: 3000,
  PINTEREST: 500,
  TIKTOK: 2200,
  YOUTUBE: 5000,
  GOOGLEBUSINESS: 1500,
}
