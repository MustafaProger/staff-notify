import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthedRequest, AuthUser } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type JwtPayload = AuthUser & { iat?: number; exp?: number };

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
      roleId: payload.roleId,
      departmentId: payload.departmentId,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}