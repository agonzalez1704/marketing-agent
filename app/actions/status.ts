"use server"

import { revalidatePath } from "next/cache"
import { runStatusSync } from "@/lib/status"

/** Manual status refresh — syncs then revalidates the client's views. */
export async function syncClientStatuses(clientId: string): Promise<{ checked: number; updated: number }> {
  const result = await runStatusSync(clientId)
  revalidatePath(`/clients/${clientId}/calendar`)
  revalidatePath(`/clients/${clientId}/posts`)
  revalidatePath(`/clients/${clientId}`)
  return result
}
