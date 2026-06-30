/**
 * Zernio inbox client — DMs + comments across a client's connected accounts.
 * Scoped by profileId (= client.lateProfileId). Auth = the same LATE_API_KEY.
 * Verified against the prod zernio.service.ts contract.
 */
import "server-only"
import type { InboxItem } from "@/lib/inbox-types"

const BASE = process.env.ZERNIO_API_BASE ?? "https://zernio.com/api"

function authHeaders(): HeadersInit {
  const key = process.env.LATE_API_KEY
  if (!key) throw new Error("LATE_API_KEY is not set")
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Zernio ${init?.method ?? "GET"} ${path} -> ${res.status} ${body.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

interface ConversationRaw {
  id: string
  platform: string
  accountId: string
  accountUsername?: string
  participantName?: string
  participantPicture?: string
  lastMessage?: string
  updatedTime: string
  unreadCount?: number
  url?: string
}

interface CommentRaw {
  id: string
  platform: string
  accountId: string
  accountUsername?: string
  content?: string
  picture?: string
  permalink?: string
  createdTime: string
}

export const zernio = {
  async listConversations(profileId: string, limit = 50): Promise<ConversationRaw[]> {
    const data = await call<{ data?: ConversationRaw[] }>(
      `/v1/inbox/conversations?profileId=${encodeURIComponent(profileId)}&limit=${limit}`,
    )
    return data.data ?? []
  },

  async listComments(profileId: string, limit = 50): Promise<CommentRaw[]> {
    const data = await call<{ data?: CommentRaw[] }>(
      `/v1/inbox/comments?profileId=${encodeURIComponent(profileId)}&limit=${limit}`,
    )
    return data.data ?? []
  },

  async sendMessage(conversationId: string, accountId: string, message: string): Promise<void> {
    await call(`/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ accountId, message }),
    })
  },

  async replyComment(postId: string, accountId: string, message: string, commentId?: string): Promise<void> {
    await call(`/v1/inbox/comments/${encodeURIComponent(postId)}`, {
      method: "POST",
      body: JSON.stringify({ accountId, message, ...(commentId ? { commentId } : {}) }),
    })
  },

  /** Fetch DMs + comments for a profile, normalized + sorted newest-first. */
  async fetchInbox(profileId: string): Promise<InboxItem[]> {
    const [convs, comments] = await Promise.all([
      this.listConversations(profileId).catch(() => []),
      this.listComments(profileId).catch(() => []),
    ])

    const dms: InboxItem[] = convs.map((c) => ({
      id: `dm:${c.id}`,
      kind: "dm",
      platform: c.platform,
      accountId: c.accountId,
      refId: c.id,
      author: c.participantName || c.accountUsername || "Unknown",
      avatar: c.participantPicture ?? null,
      preview: c.lastMessage ?? "",
      timestamp: c.updatedTime,
      permalink: c.url ?? null,
      unread: (c.unreadCount ?? 0) > 0,
    }))

    const cmts: InboxItem[] = comments.map((c) => ({
      id: `cmt:${c.id}`,
      kind: "comment",
      platform: c.platform,
      accountId: c.accountId,
      refId: c.id,
      author: c.accountUsername || "Comment",
      avatar: c.picture ?? null,
      preview: c.content ?? "",
      timestamp: c.createdTime,
      permalink: c.permalink ?? null,
      unread: false,
    }))

    return [...dms, ...cmts].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
  },
}
