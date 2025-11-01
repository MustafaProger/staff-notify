import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { authMiddleware } from "./middleware";
import type { AuthedRequest } from "../types/auth";

const router = Router();

/** Schemas */
const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

const RegisterSchema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(8, "Пароль должен содержать минимум 8 символов")
		.regex(/[A-Z]/, "Нужна заглавная буква")
		.regex(/[a-z]/, "Нужна строчная буква")
		.regex(/[0-9]/, "Нужна цифра"),
	fullName: z.string().min(1, "Укажите полное имя"),
	departmentId: z.number().int("departmentId должен быть числом"),
});

/** POST /auth/login */
router.post("/login", async (req: Request, res: Response) => {
	try {
		const dto = LoginSchema.parse(req.body);

		const user = await prisma.user.findUnique({ where: { email: dto.email } });
		if (!user) return res.status(401).json({ message: "Invalid credentials" });

		const ok = await bcrypt.compare(dto.password, user.passwordHash);
		if (!ok) return res.status(401).json({ message: "Invalid credentials" });

		// аудит входа
		await prisma.auditLog.create({
			data: {
				action: "user_login",
				entity: "user",
				entityId: user.id,
				metadata: { email: user.email },
			},
		});

		const secret = process.env.JWT_SECRET || "dev-secret";
		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				roleId: user.roleId,
				departmentId: user.departmentId,
			},
			secret,
			{ expiresIn: "7d" }
		);

		return res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				roleId: user.roleId,
				departmentId: user.departmentId,
			},
		});
	} catch (err: any) {
		if (err instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Validation error", errors: err.flatten() });
		}
		console.error("[/auth/login] error:", err);
		return res.status(500).json({ message: "Internal error" });
	}
});

/** POST /auth/register */
router.post("/register", async (req: Request, res: Response) => {
	try {
		const dto = RegisterSchema.parse(req.body);

		// 1) Email уже существует?
		const existing = await prisma.user.findUnique({
			where: { email: dto.email },
			select: { id: true },
		});
		if (existing)
			return res.status(409).json({ message: "Email уже зарегистрирован" });

		// 2) Отдел существует?
		const department = await prisma.department.findUnique({
			where: { id: dto.departmentId },
			select: { id: true },
		});
		if (!department)
			return res.status(400).json({ message: "Некорректный departmentId" });

		// 3) Роль employee существует?
		const employeeRole = await prisma.role.findUnique({
			where: { name: "employee" },
			select: { id: true },
		});
		if (!employeeRole) {
			return res
				.status(500)
				.json({ message: "Роль employee не найдена. Запусти seed." });
		}

		// 4) Хеширование пароля
		const passwordHash = await bcrypt.hash(dto.password, 10);

		// 5) Создание пользователя
		const user = await prisma.user.create({
			data: {
				email: dto.email,
				passwordHash,
				fullName: dto.fullName,
				roleId: employeeRole.id,
				departmentId: dto.departmentId,
			},
			select: {
				id: true,
				email: true,
				fullName: true,
				roleId: true,
				departmentId: true,
			},
		});

		// 6) Аудит регистрации
		await prisma.auditLog.create({
			data: {
				action: "user_registered",
				entity: "user",
				entityId: user.id,
				metadata: {
					email: user.email,
					departmentId: dto.departmentId,
					role: "employee",
				},
			},
		});

		// 7) JWT
		const secret = process.env.JWT_SECRET || "dev-secret";
		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				roleId: user.roleId,
				departmentId: user.departmentId,
			},
			secret,
			{ expiresIn: "7d" }
		);

		return res.status(201).json({ token, user });
	} catch (err: any) {
		if (err instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Validation error", errors: err.flatten() });
		}
		console.error("[/auth/register] error:", err);
		return res.status(500).json({ message: "Internal error" });
	}
});

/** GET /auth/me */
router.get("/me", authMiddleware, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

	const me = await prisma.user.findUnique({
		where: { id: req.user.id },
		select: {
			id: true,
			email: true,
			fullName: true,
			role: { select: { id: true, name: true } },
			department: { select: { id: true, name: true } },
		},
	});

	if (!me) return res.status(404).json({ message: "User not found" });
	res.json({ item: me });
});

export default router;
