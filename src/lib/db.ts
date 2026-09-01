import { PrismaClient } from "@prisma/client";

// 开发热重载下复用同一个 Prisma 实例,避免反复建立连接。
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
