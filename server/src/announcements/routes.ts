import { Router, Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../types/auth";
import { prisma } from "../prisma";
import { CreateAnnouncementSchema, type CreateAnnouncementDto } from "./validation";

const router = Router();

// POST /announcements
router.post("/", async (req: AuthedRequest, res: Response) => {
  try {
    const dto = CreateAnnouncementSchema.parse(req.body) as CreateAnnouncementDto;

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Подготовим массив записей для AnnouncementTarget
    const roleIds = Array.from(new Set(dto.targets.roles ?? []));
    const deptIds = Array.from(new Set(dto.targets.departments ?? []));
    const userIds = Array.from(new Set(dto.targets.users ?? []));

    const targetsData: { roleId?: number; departmentId?: number; userId?: number }[] = [];
    for (const r of roleIds) targetsData.push({ roleId: r });
    for (const d of deptIds) targetsData.push({ departmentId: d });
    for (const u of userIds) targetsData.push({ userId: u });

    const created = await prisma.announcement.create({
      data: {
        title: dto.title,
        body: dto.body,
        authorId: req.user.id,
        ...(targetsData.length > 0
          ? { targets: { createMany: { data: targetsData, skipDuplicates: true } } }
          : {}),
      },
      include: {
        author: { select: { id: true, email: true, fullName: true } },
        // targets: { select: { roleId: true, departmentId: true, userId: true } },
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