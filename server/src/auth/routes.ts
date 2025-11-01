import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = LoginSchema.parse(req.body);

		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				role: true,
				department: true,
			},
		});

		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// payload для токена
		const payload = {
			id: user.id,
			email: user.email,
			roleId: user.roleId,
			departmentId: user.departmentId,
		};

		const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

		return res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				role: user.role.name,
				department: user.department.name,
			},
		});
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

export default router;
