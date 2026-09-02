import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/categories?projectId=xxx —— 某项目的分类列表(含资源数);不带 projectId 时返回全部
export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get("projectId") ?? undefined;
  const categories = await prisma.category.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { order: "asc" },
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(categories);
}

// POST /api/categories —— 新增分类(属于某项目)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const projectId = String(body.projectId ?? "");
  if (!name) return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
  if (!projectId) return NextResponse.json({ error: "缺少项目" }, { status: 400 });

  const existing = await prisma.category.findFirst({ where: { projectId, name } });
  if (existing) return NextResponse.json({ error: "该项目下已存在同名分类" }, { status: 409 });

  const max = await prisma.category.aggregate({
    where: { projectId },
    _max: { order: true },
  });
  const category = await prisma.category.create({
    data: {
      projectId,
      name,
      color: body.color || "other",
      order: (max._max.order ?? -1) + 1,
    },
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(category, { status: 201 });
}

// PUT /api/categories —— 重排分类顺序(仅更新传入 id 的 order)
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.map((x: unknown) => String(x))
    : [];
  if (!ids.length) return NextResponse.json({ error: "缺少分类顺序" }, { status: 400 });

  await prisma.$transaction(
    ids.map((id, i) => prisma.category.update({ where: { id }, data: { order: i } }))
  );
  return NextResponse.json({ ok: true });
}
