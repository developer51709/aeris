import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __prisma: any;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export * from "@prisma/client";

export interface WelcomeTemplateVars {
  server: string;
  user: string;
  mention: string;
  channel: string;
}
