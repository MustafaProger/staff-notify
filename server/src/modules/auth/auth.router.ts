import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, department: true },
    });
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        department: user.department.name,
      },
    });
  } catch (e) {
    console.error('[/auth/login] error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(["admin", "employee"]).default("employee"),
  departmentId: z.number().int().positive(),
});


router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  const { email, password, fullName, role, departmentId } = parsed.data;

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already taken" });

    // ищем роль и департамент по ID/имени
    const [roleRow, deptRow] = await Promise.all([
      prisma.role.findUnique({ where: { name: role } }),
      prisma.department.findUnique({ where: { id: departmentId } }),
    ]);
    if (!roleRow) return res.status(400).json({ error: `Unknown role: ${role}` });
    if (!deptRow) return res.status(400).json({ error: `Unknown departmentId: ${departmentId}` });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        roleId: roleRow.id,
        departmentId: deptRow.id,
      },
      include: { role: true, department: true },
    });

    return res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        department: user.department.name,
      },
    });
  } catch (e) {
    console.error("[/auth/register] error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;