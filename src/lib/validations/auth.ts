import { z } from "zod";

export const safeUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Only HTTP and HTTPS URLs are permitted" }
  );

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .transform((val) => val.toLowerCase()),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["USER", "DEVELOPER"], {
    errorMap: () => ({ message: "Role must be either USER or DEVELOPER" }),
  }),
});

export const verifyCodeSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^[0-9]{6}$/, "Verification code must contain only numbers"),
  type: z.enum(["REGISTRATION", "PASSWORD_RESET"]),
});

export const resendCodeSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
  type: z.enum(["REGISTRATION", "PASSWORD_RESET"]),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^[0-9]{6}$/, "Code must contain only numbers"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty").max(50, "Max 50 characters").trim(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().default(""),
  avatarUrl: safeUrlSchema.optional().or(z.literal("")),
});
