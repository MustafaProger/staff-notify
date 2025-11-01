import { Router, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { CreateAnnouncementSchema, type CreateAnnouncementDto } from "./validation";
import type { AuthedRequest } from "../types/auth";

const router = Router();
const prisma = new PrismaClient();

router.post("/", async (req: AuthedRequest, res: Response) => {
  try {
    const dto = CreateAnnouncementSchema.parse(req.body) as CreateAnnouncementDto;

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const created = await prisma.announcement.create({
      data: {
        title: dto.title,
        body: dto.body,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, email: true, fullName: true } },
      },
    });

    return res.status(201).json({ item: created });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", issues: e.issues });
    }
    console.error(e);
    return res.status(500).json({ message: "Internal error" });
  }
});

export default router;