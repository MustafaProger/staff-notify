import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/roles", async (_req, res) => {
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  res.json({ items: roles });
});

router.get("/departments", async (_req, res) => {
  const deps = await prisma.department.findMany({ select: { id: true, name: true } });
  res.json({ items: deps });
});

export default router;