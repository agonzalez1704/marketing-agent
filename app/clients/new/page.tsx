import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ClientForm } from "@/components/clients/client-form"

export default function NewClientPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Clients
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New client</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A client groups its own social accounts and content.
      </p>
      <div className="mt-8">
        <ClientForm />
      </div>
    </main>
  )
}
