import { z } from "zod";

export const CreateAnnouncementSchema = z.object({
	title: z.string().min(1).max(200),
	body: z.string().min(1),
});
export type CreateAnnouncementDto = z.infer<typeof CreateAnnouncementSchema>;
