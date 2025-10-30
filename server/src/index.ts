// server/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./modules/auth/auth.router";

// подхватываем переменные окружения из server/.env
dotenv.config();

const app = express();

// базовые middlewares
app.use(cors());
app.use(express.json());

// служебный ping для проверки доступности сервера
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// авторизация (POST /auth/login и далее будем наращивать)
app.use("/auth", authRouter);

// стартуем сервер
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});