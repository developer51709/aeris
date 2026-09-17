import "dotenv/config";

import express from "express";
import cors from "cors";
import session from "cookie-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@aeris/shared";
import { authRoutes } from "./routes/auth.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { searchRoutes } from "./routes/search.js";
import { lookupRoutes } from "./routes/lookups.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(
  cors({
    origin: process.env.DASHBOARD_URL ?? "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

// Lightweight cookie parser (no extra dependency)
app.use((req, _res, next) => {
  const header = req.headers.cookie;
  if (header) {
    const cookies: Record<string, string> = {};
    for (const pair of header.split(";")) {
      const [key, ...rest] = pair.split("=");
      if (key) cookies[key.trim()] = rest.join("=").trim();
    }
    (req as any).cookies = cookies;
  }
  next();
});

app.use(
  session({
    name: "aeris.session",
    keys: [process.env.SESSION_SECRET ?? "dev-secret-change-in-production"],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  }),
);

app.use("/auth", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/search", searchRoutes);
app.use("/api/lookups", lookupRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Serve the dashboard build in production
const dashboardDist = path.resolve(__dirname, "../../dashboard/dist");
app.use(express.static(dashboardDist));
app.get("*", (req, res, next) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith("/auth") || req.path.startsWith("/api") || req.path.startsWith("/search") || req.path === "/health") {
    return next();
  }
  res.sendFile(path.join(dashboardDist, "index.html"));
});

const PORT = Number(process.env.API_PORT ?? 3001);
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Aeris API listening on http://0.0.0.0:${PORT}`);
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("Prisma connected");
  } catch (error) {
    console.error("Prisma connection error:", error);
    process.exitCode = 1;
  }
}

connectDatabase().catch((error) => {
  console.error("Failed to connect to database:", error);
  process.exitCode = 1;
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed");
  });
  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (error) {
    console.error("Error disconnecting Prisma:", error);
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
