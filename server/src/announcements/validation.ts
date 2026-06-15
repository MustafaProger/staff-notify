// server/src/announcements/validation.ts
import { z } from "zod";

export const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Введите заголовок").max(200, "Заголовок слишком длинный"),
  body: z.string().trim().min(1, "Введите текст объявления"),
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
