// 一次性迁移脚本:把资源上的单个 url 迁成「地址」链接(ResourceLink)。
// 步骤:1) 本脚本创建 ResourceLink 表并把 Resource.url 复制为一条 label='地址' 的链接 2) 之后运行 `npx prisma db push` 对齐 schema(新增表 + 删除 url 列)。
// 幂等:若 Resource 已无 url 列或 ResourceLink 已有数据,自动跳过。迁移完成后本脚本可删除。

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // url 列是否还在(若已被 db push 移除,说明已迁移过)
  const cols = await prisma.$queryRaw<{ name: string }[]>`PRAGMA table_info("Resource")`;
  if (!cols.some((c) => c.name === "url")) {
    console.log("Resource 已无 url 列,跳过迁移。");
    return;
  }

  // 确保 ResourceLink 表存在
  const tables = await prisma.$queryRaw<{ name: string }[]>`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ResourceLink'`;
  if (tables.length === 0) {
    await prisma.$executeRaw`
      CREATE TABLE "ResourceLink" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "resourceId" TEXT NOT NULL,
        "label" TEXT NOT NULL DEFAULT '地址',
        "url" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ResourceLink_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`;
    await prisma.$executeRaw`CREATE INDEX "ResourceLink_resourceId_idx" ON "ResourceLink"("resourceId")`;
  }

  // 幂等:已有链接则跳过
  const existing = await prisma.$queryRaw<{ n: number }[]>`SELECT COUNT(*) AS n FROM "ResourceLink"`;
  if (existing[0].n > 0) {
    console.log("ResourceLink 已有数据,跳过迁移。");
    return;
  }

  // 迁移 url -> 地址链接
  const rows = await prisma.$queryRaw<{ id: string; url: string }[]>`SELECT "id", "url" FROM "Resource" WHERE "url" IS NOT NULL AND TRIM("url") != ''`;
  let n = 0;
  for (const r of rows) {
    await prisma.$executeRaw`INSERT INTO "ResourceLink" ("id", "resourceId", "label", "url", "order") VALUES (${randomUUID()}, ${r.id}, ${"地址"}, ${r.url.trim()}, 0)`;
    n++;
  }

  console.log(`✅ 迁移完成:${n} 条 url 已转为「地址」链接。`);
  console.log("   请运行:npx prisma db push");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
