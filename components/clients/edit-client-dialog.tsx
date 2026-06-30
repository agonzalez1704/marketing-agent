"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LogoUpload } from "@/components/clients/logo-upload"
import { clientCreateSchema, type ClientCreateInput } from "@/lib/validations"
import { updateClient } from "@/app/actions/clients"

export interface EditableClient {
  id: string
  name: string
  logoUrl: string | null
  defaultGoal: string | null
  defaultAudience: string | null
}

export function EditClientDialog({ client }: { client: EditableClient }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientCreateInput>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues: {
      name: client.name,
      defaultGoal: client.defaultGoal ?? "",
      defaultAudience: client.defaultAudience ?? "",
    },
  })

  async function onSubmit(values: ClientCreateInput) {
    setSaving(true)
    try {
      // Logo is managed separately by LogoUpload — don't send it here.
      const { logoUrl: _logoUrl, ...rest } = values
      void _logoUrl
      await updateClient(client.id, rest)
      toast.success("Client updated")
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast.error("Couldn't update client", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o)
          reset({
            name: client.name,
            defaultGoal: client.defaultGoal ?? "",
            defaultAudience: client.defaultAudience ?? "",
          })
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>Update name, logo, and content defaults.</DialogDescription>
        </DialogHeader>

        <LogoUpload clientId={client.id} clientName={client.name} logoUrl={client.logoUrl} />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Client name" error={errors.name?.message}>
            <Input {...register("name")} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default goal" hint="Optional" error={errors.defaultGoal?.message}>
              <Input {...register("defaultGoal")} />
            </Field>
            <Field label="Default audience" hint="Optional" error={errors.defaultAudience?.message}>
              <Input {...register("defaultAudience")} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
