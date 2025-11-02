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

/** POST /announcements/:id/read — отметить "прочитал" (idempotent) */
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

/** GET /announcements/:id/stats — статистика прочтений (только для админов и автора) */
router.get("/:id/stats", async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid id" });
  }

  // Получаем объявление с таргетами
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      targets: true,
      author: { select: { id: true, fullName: true } },
    },
  });

  if (!announcement) {
    return res.status(404).json({ message: "Announcement not found" });
  }

  // Проверяем, является ли пользователь админом или автором
  const userWithRole = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { role: true },
  });
  
  const isAdmin = userWithRole?.role.name === "admin";
  const isAuthor = announcement.authorId === req.user.id;

  if (!isAdmin && !isAuthor) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Если нет таргетов, значит объявление для всех
  const hasTargets = announcement.targets.length > 0;

  let targetUserIds: number[] = [];

  if (hasTargets) {
    // Собираем все уникальные userIds из таргетов
    const roleTargets = announcement.targets.filter((t) => t.roleId).map((t) => t.roleId!);
    const deptTargets = announcement.targets.filter((t) => t.departmentId).map((t) => t.departmentId!);
    const userTargets = announcement.targets.filter((t) => t.userId).map((t) => t.userId!);

    // Получаем пользователей по ролям
    if (roleTargets.length > 0) {
      const usersByRoles = await prisma.user.findMany({
        where: { roleId: { in: roleTargets } },
        select: { id: true },
      });
      targetUserIds.push(...usersByRoles.map((u) => u.id));
    }

    // Получаем пользователей по отделам
    if (deptTargets.length > 0) {
      const usersByDepts = await prisma.user.findMany({
        where: { departmentId: { in: deptTargets } },
        select: { id: true },
      });
      targetUserIds.push(...usersByDepts.map((u) => u.id));
    }

    // Добавляем конкретных пользователей
    targetUserIds.push(...userTargets);

    // Убираем дубликаты
    targetUserIds = Array.from(new Set(targetUserIds));
  } else {
    // Если нет таргетов, получаем всех пользователей
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });
    targetUserIds = allUsers.map((u) => u.id);
  }

  // Получаем количество прочитавших
  const readCount = await prisma.readReceipt.count({
    where: { announcementId: id },
  });

  // Получаем список пользователей с прочтениями
  const readReceipts = await prisma.readReceipt.findMany({
    where: { announcementId: id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { readAt: "desc" },
  });

  const totalTargetUsers = targetUserIds.length;
  const readPercentage = totalTargetUsers > 0 ? Math.round((readCount / totalTargetUsers) * 100) : 0;

  res.json({
    announcement: {
      id: announcement.id,
      title: announcement.title,
      author: announcement.author,
      createdAt: announcement.createdAt,
    },
    stats: {
      totalTargetUsers,
      readCount,
      unreadCount: totalTargetUsers - readCount,
      readPercentage,
      hasTargets,
    },
    readers: readReceipts.map((rr) => ({
      userId: rr.user.id,
      fullName: rr.user.fullName,
      email: rr.user.email,
      department: rr.user.department.name,
      readAt: rr.readAt,
    })),
  });
});

export default router;
