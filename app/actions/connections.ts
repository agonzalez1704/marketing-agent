"use server"

import { revalidatePath } from "next/cache"
import { late, toLatePlatform, toPrismaPlatform } from "@/lib/late"
import {
  dbDeleteAccount,
  dbGetAccount,
  dbGetClientProfileId,
  dbSyncAccounts,
} from "@/lib/db"
import type { Platform } from "@/lib/types"

function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return url.replace(/\/$/, "")
}

/**
 * Begin an OAuth connect. Returns the LATE authUrl the browser should navigate to.
 * LATE redirects back to our callback, which syncs the connected accounts.
 */
export async function startConnect(clientId: string, platform: Platform): Promise<string> {
  const profileId = await dbGetClientProfileId(clientId)
  if (!profileId) throw new Error("Client not found")

  const redirectUrl = `${appUrl()}/api/late/callback?clientId=${clientId}&platform=${platform}`
  return late.getConnectUrl(toLatePlatform(platform), profileId, redirectUrl)
}

/**
 * Pull the client's connected accounts from LATE and upsert them locally.
 * Called by the OAuth callback and by a manual "refresh" action.
 */
export async function syncAccounts(clientId: string): Promise<void> {
  const profileId = await dbGetClientProfileId(clientId)
  if (!profileId) throw new Error("Client not found")

  const accounts = await late.listAccounts(profileId)
  await dbSyncAccounts(
    clientId,
    accounts.map((a) => ({
      lateAccountId: a.id,
      platform: toPrismaPlatform(a.platform),
      username: a.username ?? a.displayName ?? null,
      active: a.isActive,
    })),
  )

  revalidatePath(`/clients/${clientId}/connections`)
  revalidatePath(`/clients/${clientId}`)
}

export async function disconnectAccount(clientId: string, accountId: string): Promise<void> {
  const account = await dbGetAccount(accountId)
  if (!account || account.clientId !== clientId) throw new Error("Account not found")

  await late.deleteAccount(account.lateAccountId)
  await dbDeleteAccount(accountId)

  revalidatePath(`/clients/${clientId}/connections`)
  revalidatePath(`/clients/${clientId}`)
}
