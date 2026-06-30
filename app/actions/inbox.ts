"use server"

import { zernio } from "@/lib/zernio"
import { dbGetClient, dbListClients } from "@/lib/db"
import type { InboxGroup, InboxKind } from "@/lib/inbox-types"

/** One client's unified inbox (DMs + comments). */
export async function getClientInbox(clientId: string): Promise<InboxGroup> {
  const client = await dbGetClient(clientId)
  if (!client) throw new Error("Client not found")
  const items = await zernio.fetchInbox(client.lateProfileId).catch(() => [])
  return { clientId: client.id, clientName: client.name, clientLogo: client.logoUrl, items }
}

/** Every client's inbox, grouped. Clients with no items are dropped. */
export async function getAllInbox(): Promise<InboxGroup[]> {
  const clients = await dbListClients()
  const groups = await Promise.all(
    clients.map(async (c): Promise<InboxGroup> => {
      const items = await zernio.fetchInbox(c.lateProfileId).catch(() => [])
      return { clientId: c.id, clientName: c.name, clientLogo: c.logoUrl, items }
    }),
  )
  return groups.filter((g) => g.items.length > 0)
}

export async function replyToInboxItem(input: {
  clientId: string
  kind: InboxKind
  refId: string
  accountId: string
  message: string
}): Promise<void> {
  const message = input.message.trim()
  if (!message) throw new Error("Message is empty")
  if (message.length > 2000) throw new Error("Message exceeds 2000 characters")

  const client = await dbGetClient(input.clientId)
  if (!client) throw new Error("Client not found")

  if (input.kind === "dm") {
    await zernio.sendMessage(input.refId, input.accountId, message)
  } else {
    await zernio.replyComment(input.refId, input.accountId, message)
  }
}
