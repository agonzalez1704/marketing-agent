"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clientCreateSchema, type ClientCreateInput } from "@/lib/validations"
import { createClient } from "@/app/actions/clients"

export function ClientForm() {
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientCreateInput>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues: { name: "", logoUrl: "", defaultGoal: "", defaultAudience: "" },
  })

  async function onSubmit(values: ClientCreateInput) {
    setSubmitting(true)
    try {
      // createClient redirects on success; a thrown error lands here.
      await createClient(values)
    } catch (err) {
      // Next's redirect throws a special error we must rethrow.
      if (err && typeof err === "object" && "digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
        throw err
      }
      setSubmitting(false)
      toast.error("Couldn't create client", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Client name" error={errors.name?.message}>
        <Input placeholder="Acme Coffee Co." {...register("name")} autoFocus />
      </Field>

      <Field label="Logo URL" hint="Optional" error={errors.logoUrl?.message}>
        <Input placeholder="https://…/logo.png" {...register("logoUrl")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Default goal" hint="Optional" error={errors.defaultGoal?.message}>
          <Input placeholder="Grow engagement" {...register("defaultGoal")} />
        </Field>
        <Field label="Default audience" hint="Optional" error={errors.defaultAudience?.message}>
          <Input placeholder="Local coffee lovers" {...register("defaultAudience")} />
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Create client
        </Button>
        <p className="text-xs text-muted-foreground">
          Creates a LATE profile so you can connect accounts next.
        </p>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
