// Domain types — replace the old Prisma-generated types.

export type Platform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LINKEDIN"
  | "TWITTER"
  | "PINTEREST"
  | "TIKTOK"
  | "YOUTUBE"
  | "GOOGLEBUSINESS"

export type AccountStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR"
export type AssetOrigin = "WEBSITE_URL" | "PDF_FILE" | "MANUAL" | "IMAGE" | "VIDEO"

export interface BrandColor {
  hex: string
  label: string
}

export interface ClientIdentity {
  summary: string
  tone: string
  voice: string
  audience: string
  industry: string
  keywords: string[]
  services: string[]
  colors: BrandColor[]
}
export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED"

export interface Client {
  id: string
  name: string
  logoUrl: string | null
  lateProfileId: string
  defaultGoal: string | null
  defaultAudience: string | null
  identity: ClientIdentity | null
  createdAt: string
}

export interface ClientWithCounts extends Client {
  accountsCount: number
  assetsCount: number
  postsCount: number
}

export interface SocialAccount {
  id: string
  clientId: string
  platform: Platform
  username: string | null
  lateAccountId: string
  status: AccountStatus
}

export interface AssetImage {
  src: string
  alt?: string
  isBgImage?: boolean
}

export interface Asset {
  id: string
  clientId: string
  name: string
  source: string
  origin: AssetOrigin
  text: string | null
  images: AssetImage[]
  videos: unknown[]
  createdAt: string
}

export interface Post {
  id: string
  clientId: string
  assetId: string | null
  platform: Platform
  content: string
  mediaUrls: string[]
  status: PostStatus
  scheduledFor: string | null
  latePostId: string | null
  errorMessage: string | null
  createdAt: string
}

// ---- snake_case DB rows ----
export interface ClientRow {
  id: string
  name: string
  logo_url: string | null
  late_profile_id: string
  default_goal: string | null
  default_audience: string | null
  identity: ClientIdentity | null
  created_at: string
}

export interface SocialAccountRow {
  id: string
  client_id: string
  platform: Platform
  username: string | null
  late_account_id: string
  status: AccountStatus
}

// ---- mappers ----
export function mapClient(r: ClientRow): Client {
  return {
    id: r.id,
    name: r.name,
    logoUrl: r.logo_url,
    lateProfileId: r.late_profile_id,
    defaultGoal: r.default_goal,
    defaultAudience: r.default_audience,
    identity: (r.identity as ClientIdentity | null) ?? null,
    createdAt: r.created_at,
  }
}

export function mapAccount(r: SocialAccountRow): SocialAccount {
  return {
    id: r.id,
    clientId: r.client_id,
    platform: r.platform,
    username: r.username,
    lateAccountId: r.late_account_id,
    status: r.status,
  }
}
