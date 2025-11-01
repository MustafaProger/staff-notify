import { Router, Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../types/auth";
import { prisma } from "../prisma";
import {
	CreateAnnouncementSchema,
	type CreateAnnouncementDto,
} from "./validation";
import { Prisma } from "@prisma/client";

const router = Router();

/** Zod-схема для query-параметров пагинации */
const ListQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

/** GET /announcements — лента для текущего пользователя */
router.get("/", async (req: AuthedRequest, res: Response) => {
	if (!req.user) return res.status(401).json({ message: "Unauthorized" });

	const { limit, offset } = ListQuerySchema.parse(req.query);
	const { id: userId, roleId, departmentId } = req.user;

	// ВАЖНО: никаких "as const" — иначе получится readonly-массив
	const where: Prisma.AnnouncementWhereInput = {
		OR: [
			{ targets: { some: { roleId } } },
			{ targets: { some: { departmentId } } },
			{ targets: { some: { userId } } },
		],
	};

	const [total, items] = await Promise.all([
		prisma.announcement.count({ where }),
		prisma.announcement.findMany({
			where,
			include: {
				author: { select: { id: true, fullName: true, email: true } },
				// targets: true,
			},
			orderBy: { createdAt: "desc" },
			skip: offset,
			take: limit,
		}),
	]);

	res.json({
		items,
		pagination: {
			total,
			limit,
			offset,
			hasMore: offset + items.length < total,
		},
	});
});

/** POST /announcements — создание (как было) */
router.post("/", async (req: AuthedRequest, res: Response) => {
	try {
		const dto = CreateAnnouncementSchema.parse(
			req.body
		) as CreateAnnouncementDto;

		if (!req.user?.id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		// Подготовим массив записей для AnnouncementTarget
		const roleIds = Array.from(new Set(dto.targets.roles ?? []));
		const deptIds = Array.from(new Set(dto.targets.departments ?? []));
		const userIds = Array.from(new Set(dto.targets.users ?? []));

		const targetsData: {
			roleId?: number;
			departmentId?: number;
			userId?: number;
		}[] = [];
		for (const r of roleIds) targetsData.push({ roleId: r });
		for (const d of deptIds) targetsData.push({ departmentId: d });
		for (const u of userIds) targetsData.push({ userId: u });

		const created = await prisma.announcement.create({
			data: {
				title: dto.title,
				body: dto.body,
				authorId: req.user.id,
				...(targetsData.length > 0
					? {
							targets: {
								createMany: { data: targetsData, skipDuplicates: true },
							},
					  }
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
			return res
				.status(400)
				.json({ message: "Validation error", issues: e.issues });
		}
		console.error(e);
		return res.status(500).json({ message: "Internal error" });
	}
});

/** GET /announcements/:id — деталка + isRead */
router.get("/:id", async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

  const userId = req.user.id;

  const item = await prisma.announcement.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, fullName: true, email: true } },
      _count: {
        select: {
          readReceipts: { where: { userId } }, // Prisma 6.x поддерживает where в _count
        },
      },
    },
  });

  if (!item) return res.status(404).json({ message: "Not found" });

  const isRead = (item._count as any)?.readReceipts > 0;
  // уберём служебный _count из ответа
  const { _count, ...rest } = item as any;

  res.json({ item: { ...rest, isRead } });
});

/** POST /announcements/:id/read — отметить “прочитал” (idempotent) */
router.post("/:id/read", async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

  const userId = req.user.id;

  // проверим, что объявление существует и доступно этому пользователю
  const canSee = await prisma.announcement.findFirst({
    where: {
      id,
      OR: [
        { targets: { some: { roleId: req.user.roleId } } },
        { targets: { some: { departmentId: req.user.departmentId } } },
        { targets: { some: { userId } } },
      ],
    },
    select: { id: true },
  });
  if (!canSee) return res.status(404).json({ message: "Announcement not available" });

  // upsert по уникальному ключу (userId, announcementId)
  await prisma.readReceipt.upsert({
    where: { userId_announcementId: { userId, announcementId: id } },
    create: { userId, announcementId: id },
    update: {}, // уже прочитано — ничего не меняем
  });

  // аудит
  await prisma.auditLog.create({
    data: {
      action: "announcement_read",
      entity: "announcement",
      entityId: id,
      metadata: { userId },
    },
  });

  res.status(204).send(); // без тела, idempotent
});

export default router;
