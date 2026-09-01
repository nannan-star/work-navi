import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/categories —— 分类列表(含资源数)
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(categories);
}

// POST /api/categories —— 新增分类
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "分类已存在" }, { status: 409 });

  const max = await prisma.category.aggregate({ _max: { order: true } });
  const category = await prisma.category.create({
    data: {
      name,
      color: body.color || "other",
      order: (max._max.order ?? -1) + 1,
    },
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(category, { status: 201 });
}
