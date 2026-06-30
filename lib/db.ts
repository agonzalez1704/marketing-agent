import { insforge, unwrap } from "@/lib/insforge"
import {
  mapAccount,
  mapClient,
  type Asset,
  type AssetImage,
  type AssetOrigin,
  type Client,
  type ClientRow,
  type ClientWithCounts,
  type Platform,
  type Post,
  type PostStatus,
  type SocialAccount,
  type SocialAccountRow,
} from "@/lib/types"

// ---- Clients ----

type CountRow = ClientRow & {
  social_accounts?: { count: number }[]
  assets?: { count: number }[]
  posts?: { count: number }[]
}

function mapClientWithCounts(r: CountRow): ClientWithCounts {
  return {
    ...mapClient(r),
    accountsCount: r.social_accounts?.[0]?.count ?? 0,
    assetsCount: r.assets?.[0]?.count ?? 0,
    postsCount: r.posts?.[0]?.count ?? 0,
  }
}

const COUNT_SELECT = "*, social_accounts(count), assets(count), posts(count)"

export async function dbListClients(): Promise<ClientWithCounts[]> {
  const rows = unwrap(
    await insforge.database
      .from("clients")
      .select(COUNT_SELECT)
      .order("created_at", { ascending: false }),
  ) as CountRow[]
  return rows.map(mapClientWithCounts)
}

export async function dbGetClientWithCounts(id: string): Promise<ClientWithCounts | null> {
  const row = unwrap(
    await insforge.database.from("clients").select(COUNT_SELECT).eq("id", id).maybeSingle(),
  ) as CountRow | null
  return row ? mapClientWithCounts(row) : null
}

export async function dbGetClient(id: string): Promise<Client | null> {
  const row = unwrap(
    await insforge.database.from("clients").select().eq("id", id).maybeSingle(),
  ) as ClientRow | null
  return row ? mapClient(row) : null
}

export async function dbGetClientProfileId(id: string): Promise<string | null> {
  const row = unwrap(
    await insforge.database.from("clients").select("late_profile_id").eq("id", id).maybeSingle(),
  ) as { late_profile_id: string } | null
  return row?.late_profile_id ?? null
}

export async function dbCreateClient(input: {
  name: string
  logoUrl: string | null
  lateProfileId: string
  defaultGoal: string | null
  defaultAudience: string | null
}): Promise<Client> {
  const rows = unwrap(
    await insforge.database
      .from("clients")
      .insert([
        {
          name: input.name,
          logo_url: input.logoUrl,
          late_profile_id: input.lateProfileId,
          default_goal: input.defaultGoal,
          default_audience: input.defaultAudience,
        },
      ])
      .select(),
  ) as ClientRow[]
  return mapClient(rows[0])
}

export async function dbUpdateClient(
  id: string,
  patch: Partial<{
    name: string
    logoUrl: string | null
    defaultGoal: string | null
    defaultAudience: string | null
  }>,
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl
  if (patch.defaultGoal !== undefined) row.default_goal = patch.defaultGoal
  if (patch.defaultAudience !== undefined) row.default_audience = patch.defaultAudience
  if (Object.keys(row).length === 0) return
  unwrap(await insforge.database.from("clients").update(row).eq("id", id).select())
}

export async function dbDeleteClient(id: string): Promise<void> {
  unwrap(await insforge.database.from("clients").delete().eq("id", id))
}

export async function dbSetClientIdentity(id: string, identity: unknown): Promise<void> {
  unwrap(await insforge.database.from("clients").update({ identity }).eq("id", id).select())
}

export async function dbSetClientLogo(id: string, url: string | null, key: string | null): Promise<void> {
  unwrap(
    await insforge.database.from("clients").update({ logo_url: url, logo_key: key }).eq("id", id).select(),
  )
}

export async function dbGetClientLogoKey(id: string): Promise<string | null> {
  const row = unwrap(
    await insforge.database.from("clients").select("logo_key").eq("id", id).maybeSingle(),
  ) as { logo_key: string | null } | null
  return row?.logo_key ?? null
}

// ---- Social accounts ----

export async function dbListAccounts(clientId: string): Promise<SocialAccount[]> {
  const rows = unwrap(
    await insforge.database
      .from("social_accounts")
      .select()
      .eq("client_id", clientId)
      .order("created_at", { ascending: true }),
  ) as SocialAccountRow[]
  return rows.map(mapAccount)
}

export async function dbGetAccount(id: string): Promise<SocialAccount | null> {
  const row = unwrap(
    await insforge.database.from("social_accounts").select().eq("id", id).maybeSingle(),
  ) as SocialAccountRow | null
  return row ? mapAccount(row) : null
}

export async function dbDeleteAccount(id: string): Promise<void> {
  unwrap(await insforge.database.from("social_accounts").delete().eq("id", id))
}

// ---- Assets ----

interface AssetRow {
  id: string
  client_id: string
  name: string
  source: string
  origin: AssetOrigin
  text: string | null
  images: AssetImage[]
  videos: unknown[]
  created_at: string
}

function mapAsset(r: AssetRow): Asset {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name,
    source: r.source,
    origin: r.origin,
    text: r.text,
    images: Array.isArray(r.images) ? r.images : [],
    videos: Array.isArray(r.videos) ? r.videos : [],
    createdAt: r.created_at,
  }
}

export async function dbCreateAsset(input: {
  clientId: string
  name: string
  source: string
  origin: AssetOrigin
  text: string | null
  images: AssetImage[]
  videos?: { url: string }[]
}): Promise<Asset> {
  const rows = unwrap(
    await insforge.database
      .from("assets")
      .insert([
        {
          client_id: input.clientId,
          name: input.name,
          source: input.source,
          origin: input.origin,
          text: input.text,
          images: input.images,
          videos: input.videos ?? [],
        },
      ])
      .select(),
  ) as AssetRow[]
  return mapAsset(rows[0])
}

export async function dbListAssets(clientId: string): Promise<Asset[]> {
  const rows = unwrap(
    await insforge.database
      .from("assets")
      .select("id, client_id, name, source, origin, images, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ) as AssetRow[]
  return rows.map((r) => mapAsset({ ...r, text: null, videos: [] }))
}

export async function dbGetAsset(id: string): Promise<Asset | null> {
  const row = unwrap(
    await insforge.database.from("assets").select().eq("id", id).maybeSingle(),
  ) as AssetRow | null
  return row ? mapAsset(row) : null
}

/** Most recent asset with extracted text — the best source for brand identity. */
export async function dbGetLatestAssetWithText(clientId: string): Promise<Asset | null> {
  const row = unwrap(
    await insforge.database
      .from("assets")
      .select()
      .eq("client_id", clientId)
      .not("text", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ) as AssetRow | null
  return row ? mapAsset(row) : null
}

export async function dbDeleteAsset(id: string): Promise<void> {
  unwrap(await insforge.database.from("assets").delete().eq("id", id))
}

// ---- Posts ----

interface PostRow {
  id: string
  client_id: string
  asset_id: string | null
  platform: Platform
  content: string
  media_urls: string[]
  status: PostStatus
  scheduled_for: string | null
  late_post_id: string | null
  error_message: string | null
  created_at: string
}

function mapPost(r: PostRow): Post {
  return {
    id: r.id,
    clientId: r.client_id,
    assetId: r.asset_id,
    platform: r.platform,
    content: r.content,
    mediaUrls: Array.isArray(r.media_urls) ? r.media_urls : [],
    status: r.status,
    scheduledFor: r.scheduled_for,
    latePostId: r.late_post_id,
    errorMessage: r.error_message,
    createdAt: r.created_at,
  }
}

export async function dbCreatePosts(
  clientId: string,
  assetId: string | null,
  posts: Array<{ platform: Platform; content: string; mediaUrls?: string[] }>,
): Promise<Post[]> {
  if (posts.length === 0) return []
  const rows = posts.map((p) => ({
    client_id: clientId,
    asset_id: assetId,
    platform: p.platform,
    content: p.content,
    media_urls: p.mediaUrls ?? [],
    status: "DRAFT" as PostStatus,
  }))
  const created = unwrap(await insforge.database.from("posts").insert(rows).select()) as PostRow[]
  return created.map(mapPost)
}

export async function dbListPosts(clientId: string): Promise<Post[]> {
  const rows = unwrap(
    await insforge.database
      .from("posts")
      .select()
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ) as PostRow[]
  return rows.map(mapPost)
}

/** Clone a post (content + platform + media) as a fresh DRAFT. */
export async function dbDuplicatePost(id: string): Promise<Post | null> {
  const src = unwrap(
    await insforge.database.from("posts").select().eq("id", id).maybeSingle(),
  ) as PostRow | null
  if (!src) return null
  const rows = unwrap(
    await insforge.database
      .from("posts")
      .insert([
        {
          client_id: src.client_id,
          asset_id: src.asset_id,
          platform: src.platform,
          content: src.content,
          media_urls: Array.isArray(src.media_urls) ? src.media_urls : [],
          status: "DRAFT" as PostStatus,
        },
      ])
      .select(),
  ) as PostRow[]
  return mapPost(rows[0])
}

export async function dbGetPost(id: string): Promise<Post | null> {
  const row = unwrap(
    await insforge.database.from("posts").select().eq("id", id).maybeSingle(),
  ) as PostRow | null
  return row ? mapPost(row) : null
}

export async function dbSetPostMedia(id: string, mediaUrls: string[]): Promise<void> {
  unwrap(await insforge.database.from("posts").update({ media_urls: mediaUrls }).eq("id", id).select())
}

export async function dbSetPostContent(id: string, content: string): Promise<void> {
  unwrap(await insforge.database.from("posts").update({ content }).eq("id", id).select())
}

/** Posts that are live on LATE and may have progressed (for status sync). */
export async function dbListPostsToSync(clientId: string): Promise<Post[]> {
  const rows = unwrap(
    await insforge.database
      .from("posts")
      .select()
      .eq("client_id", clientId)
      .in("status", ["SCHEDULED", "PUBLISHING"]),
  ) as PostRow[]
  return rows.map(mapPost).filter((p) => p.latePostId)
}

export async function dbUpdatePostStatus(
  id: string,
  status: PostStatus,
  errorMessage?: string | null,
): Promise<void> {
  unwrap(
    await insforge.database
      .from("posts")
      .update({ status, ...(errorMessage !== undefined ? { error_message: errorMessage } : {}) })
      .eq("id", id)
      .select(),
  )
}

export async function dbDeletePost(id: string): Promise<void> {
  unwrap(await insforge.database.from("posts").delete().eq("id", id))
}

/** Set/clear a post's planned datetime (status stays DRAFT until pushed to LATE). */
export async function dbSetSchedule(id: string, scheduledFor: string | null): Promise<void> {
  unwrap(
    await insforge.database.from("posts").update({ scheduled_for: scheduledFor }).eq("id", id).select("id"),
  )
}

/** Mark a post as pushed to LATE. */
export async function dbMarkScheduled(id: string, latePostId: string): Promise<void> {
  unwrap(
    await insforge.database
      .from("posts")
      .update({ status: "SCHEDULED", late_post_id: latePostId, error_message: null })
      .eq("id", id)
      .select("id"),
  )
}

/** Revert a post to an unsent draft (e.g. after cancelling on LATE). */
export async function dbMarkDraft(id: string, keepSchedule = true): Promise<void> {
  const patch: Record<string, unknown> = { status: "DRAFT", late_post_id: null }
  if (!keepSchedule) patch.scheduled_for = null
  unwrap(await insforge.database.from("posts").update(patch).eq("id", id).select("id"))
}

export async function dbMarkPostFailed(id: string, message: string): Promise<void> {
  unwrap(
    await insforge.database
      .from("posts")
      .update({ status: "FAILED", error_message: message.slice(0, 500) })
      .eq("id", id)
      .select("id"),
  )
}

/**
 * Replace a client's cached accounts with the given LATE accounts:
 * delete those no longer present, upsert the rest.
 */
export async function dbSyncAccounts(
  clientId: string,
  accounts: Array<{ lateAccountId: string; platform: Platform; username: string | null; active: boolean }>,
): Promise<void> {
  const keepIds = accounts.map((a) => a.lateAccountId).filter(Boolean)

  // Drop accounts that disappeared from LATE.
  const existing = unwrap(
    await insforge.database
      .from("social_accounts")
      .select("id, late_account_id")
      .eq("client_id", clientId),
  ) as Array<{ id: string; late_account_id: string }>
  const stale = existing.filter((e) => !keepIds.includes(e.late_account_id))
  for (const s of stale) {
    unwrap(await insforge.database.from("social_accounts").delete().eq("id", s.id))
  }

  // Upsert current accounts (manual: update if present, else insert).
  for (const a of accounts) {
    const found = existing.find((e) => e.late_account_id === a.lateAccountId)
    const payload = {
      client_id: clientId,
      late_account_id: a.lateAccountId,
      platform: a.platform,
      username: a.username,
      status: a.active ? "CONNECTED" : "ERROR",
    }
    if (found) {
      unwrap(await insforge.database.from("social_accounts").update(payload).eq("id", found.id).select())
    } else {
      unwrap(await insforge.database.from("social_accounts").insert([payload]).select())
    }
  }
}
