// server/src/announcements/validation.ts
import { z } from "zod";

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  targets: z
    .object({
      roles: z.array(z.number().int().positive()).optional().default([]),
      departments: z.array(z.number().int().positive()).optional().default([]),
      users: z.array(z.number().int().positive()).optional().default([]),
    })
    .optional()
    .default({ roles: [], departments: [], users: [] }),
});

export type CreateAnnouncementDto = z.infer<typeof CreateAnnouncementSchema>;