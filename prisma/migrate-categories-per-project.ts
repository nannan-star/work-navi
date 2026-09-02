// 一次性迁移脚本:把全局分类改为「按项目独立」的分类。
// 步骤:1) 给 Category 加 projectId 列(可空) 2) 按资源归属回填 / 克隆 3) 给「管理后台」一个颜色。
// 之后再运行 `npx prisma db push` 使表结构对齐 schema(补 NOT NULL + 复合唯一 + 外键)。
// 数据不会删除;迁移完成后本脚本可删除。

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw<{ name: string }[]>`PRAGMA table_info("Category")`;
  if (cols.some((c) => c.name === "projectId")) {
    console.log("Category 已含 projectId 列,跳过迁移。");
    return;
  }

  await prisma.$executeRaw`ALTER TABLE "Category" ADD COLUMN "projectId" TEXT`;

  const projects = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Project" ORDER BY "createdAt" ASC, "id" ASC`;
  const categories = await prisma.$queryRaw<
    { id: string; name: string; color: string; order: number }[]
  >`SELECT "id", "name", "color", "order" FROM "Category" ORDER BY "order" ASC, "id" ASC`;

  if (projects.length === 0) {
    throw new Error("没有项目可挂载分类,请先创建项目后再迁移。");
  }

  let cloned = 0;
  for (const cat of categories) {
    const rows = await prisma.$queryRaw<{ projectId: string }[]>`SELECT DISTINCT "projectId" FROM "Resource" WHERE "categoryId" = ${cat.id}`;
    const projectIds = rows.map((r) => r.projectId);

    if (projectIds.length === 0) {
      // 无资源的孤儿分类:挂到第一个项目
      await prisma.$executeRaw`UPDATE "Category" SET "projectId" = ${projects[0].id} WHERE "id" = ${cat.id}`;
    } else {
      // 主副本挂到第一个使用它的项目
      await prisma.$executeRaw`UPDATE "Category" SET "projectId" = ${projectIds[0]} WHERE "id" = ${cat.id}`;
      // 其余项目各克隆一份,并重定向其资源
      for (let i = 1; i < projectIds.length; i++) {
        const newId = randomUUID();
        await prisma.$executeRaw`INSERT INTO "Category" ("id","projectId","name","color","order") VALUES (${newId}, ${projectIds[i]}, ${cat.name}, ${cat.color}, ${cat.order})`;
        await prisma.$executeRaw`UPDATE "Resource" SET "categoryId" = ${newId} WHERE "categoryId" = ${cat.id} AND "projectId" = ${projectIds[i]}`;
        cloned++;
      }
    }
  }

  // 给「管理后台」分类一个颜色(青色)
  const updated = await prisma.$executeRaw`UPDATE "Category" SET "color" = ${"env"} WHERE "name" = ${"管理后台"} AND "color" = ${"other"}`;

  const result = await prisma.$queryRaw<{ n: number }[]>`SELECT COUNT(*) AS n FROM "Category"`;
  console.log(`✅ 迁移完成:分类 ${result[0].n} 个(克隆 ${cloned} 个,改色 ${updated} 条)。`);
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
