import { NextResponse } from "next/server"
import { unauthorizedResponse } from "@/lib/api-auth"
import { dbListClients } from "@/lib/db"

export const dynamic = "force-dynamic"

/** List clients (id + name) so external systems can pick a target. */
export async function GET(req: Request) {
  const unauth = unauthorizedResponse(req)
  if (unauth) return unauth

  const clients = await dbListClients()
  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      connectedAccounts: c.accountsCount,
    })),
  })
}
