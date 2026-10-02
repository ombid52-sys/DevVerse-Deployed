import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]),
  disabledUntil: z.string().datetime().nullable().optional(),
  reason: z.string().max(200).optional(),
});

export const adminInitSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric, hyphens, and underscores only")
    .transform((v) => v.toLowerCase()),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  password: z
    .string()
    .min(10, "Admin password must be at least 10 characters")
    .max(100)
    .regex(/[A-Z]/, "Requires uppercase letter")
    .regex(/[a-z]/, "Requires lowercase letter")
    .regex(/[0-9]/, "Requires number")
    .regex(/[^A-Za-z0-9]/, "Requires special character"),
  bootstrapToken: z.string().optional(),
});
