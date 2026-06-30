"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { late } from "@/lib/late"
import {
  dbCreateClient,
  dbDeleteClient,
  dbGetClient,
  dbListClients,
  dbUpdateClient,
} from "@/lib/db"
import {
  clientCreateSchema,
  clientUpdateSchema,
  type ClientCreateInput,
  type ClientUpdateInput,
} from "@/lib/validations"

export async function listClients() {
  return dbListClients()
}

export async function getClient(id: string) {
  return dbGetClient(id)
}

export async function createClient(input: ClientCreateInput) {
  const data = clientCreateSchema.parse(input)

  // One client == one LATE profile. Create it up front so connections are scoped.
  const lateProfileId = await late.createProfile(data.name)

  const client = await dbCreateClient({
    name: data.name,
    logoUrl: data.logoUrl || null,
    lateProfileId,
    defaultGoal: data.defaultGoal || null,
    defaultAudience: data.defaultAudience || null,
  })

  revalidatePath("/")
  redirect(`/clients/${client.id}`)
}

export async function updateClient(id: string, input: ClientUpdateInput) {
  const data = clientUpdateSchema.parse(input)
  await dbUpdateClient(id, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl || null } : {}),
    ...(data.defaultGoal !== undefined ? { defaultGoal: data.defaultGoal || null } : {}),
    ...(data.defaultAudience !== undefined ? { defaultAudience: data.defaultAudience || null } : {}),
  })
  revalidatePath("/")
  revalidatePath(`/clients/${id}`)
}

export async function deleteClient(id: string) {
  // FK cascade removes accounts/assets/posts. LATE profile left for manual cleanup.
  await dbDeleteClient(id)
  revalidatePath("/")
}
