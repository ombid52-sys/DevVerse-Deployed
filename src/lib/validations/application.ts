import { z } from "zod";
import { safeUrlSchema } from "./auth";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const platformEnum = z.enum([
  "WINDOWS",
  "LINUX",
  "MACOS",
  "ANDROID",
  "WEB_APP",
]);

export const categoryEnum = z.enum([
  "AI",
  "GAMING",
  "UTILITY",
  "DEVELOPER_TOOLS",
  "PRODUCTIVITY",
  "EDUCATION",
  "MULTIMEDIA",
  "FINANCE",
  "SECURITY",
  "COMMUNICATION",
  "OTHER",
]);

export const visibilityEnum = z.enum(["PUBLIC", "PRIVATE"]);

export const createApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60, "Max 60 characters").trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(70, "Max 70 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric characters separated by hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Max 2000 characters").trim(),
  platform: platformEnum,
  category: categoryEnum,
  thumbnailUrl: safeUrlSchema,
  heroBannerUrl: safeUrlSchema.optional().or(z.literal("")),
  screenshots: z.array(safeUrlSchema).max(8, "Maximum 8 screenshots allowed").default([]),
  runtimeUrl: safeUrlSchema.optional().or(z.literal("")),
  visibility: visibilityEnum.default("PUBLIC"),
  isRunnable: z.boolean().optional(),
  runtimeType: z.enum(["STATIC_ZIP", "EXTERNAL_URL", "BOTH"]).nullable().optional(),
  entrypointPath: z.string().max(300).nullable().optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  slug: z
    .string()
    .min(2)
    .max(70)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});
