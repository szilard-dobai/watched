import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

export const watchFormSchema = z
  .object({
    status: z.enum(["in_progress", "finished"]),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date().optional(),
    platform: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "finished" && data.endDate && data.startDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  )

export type WatchFormValues = z.infer<typeof watchFormSchema>

export const addEntryFormSchema = z
  .object({
    listId: z.string().min(1, "Please select a list"),
    watchStatus: z.enum(["planned", "in_progress", "finished"]),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    platform: z.string().optional(),
    notes: z.string().optional(),
    rating: z.enum(["disliked", "liked", "loved"]).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.watchStatus === "in_progress" || data.watchStatus === "finished") {
        return !!data.startDate
      }
      return true
    },
    {
      message: "Start date is required",
      path: ["startDate"],
    }
  )
  .refine(
    (data) => {
      if (data.watchStatus === "finished" && data.endDate && data.startDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  )

export type AddEntryFormValues = z.infer<typeof addEntryFormSchema>

export const editEntryFormSchema = z.object({
  platform: z.string().optional(),
  rating: z.enum(["disliked", "liked", "loved"]).optional().nullable(),
})

export type EditEntryFormValues = z.infer<typeof editEntryFormSchema>
