import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(60, "Max 60 characters").trim(),
  description: z.string().max(300, "Description cannot exceed 300 characters").optional().default(""),
});

export const updateCollectionSchema = createCollectionSchema.partial();
