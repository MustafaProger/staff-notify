// server/src/types/auth.ts
import { Request } from "express";

export type AuthUser = {
  id: number;
  email: string;
  roleId: number;
  departmentId: number;
};

// Расширяем Request локально (без глобальной декларации)
export type AuthedRequest = Request & { user?: AuthUser };