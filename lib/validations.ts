import { z } from "zod"

export const clientCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  defaultGoal: z.string().max(120).optional(),
  defaultAudience: z.string().max(120).optional(),
})

export type ClientCreateInput = z.infer<typeof clientCreateSchema>

export const clientUpdateSchema = clientCreateSchema.partial()
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
