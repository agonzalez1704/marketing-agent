import type { Platform } from "@/lib/types"

export type InboxKind = "dm" | "comment"

export interface InboxItem {
  id: string // `dm:<id>` | `cmt:<id>`
  kind: InboxKind
  platform: string // raw Zernio platform (may be outside our 7)
  accountId: string // social account to reply from
  refId: string // conversationId (dm) or postId (comment)
  author: string
  avatar: string | null
  preview: string
  timestamp: string // ISO
  permalink: string | null
  unread: boolean
}

export interface InboxGroup {
  clientId: string
  clientName: string
  clientLogo: string | null
  items: InboxItem[]
}

const KNOWN: Platform[] = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "TWITTER", "PINTEREST", "TIKTOK", "YOUTUBE", "GOOGLEBUSINESS"]

/** Resolve a Zernio platform string to one of our known platforms, or null. */
export function knownPlatform(p: string): Platform | null {
  const up = p?.toUpperCase()
  return (KNOWN as string[]).includes(up) ? (up as Platform) : null
}
