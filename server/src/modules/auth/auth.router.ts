import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

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

export default router;