import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects —— 项目列表(含资源数)
export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(projects);
}

// POST /api/projects —— 新建项目
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });

  const max = await prisma.project.aggregate({ _max: { order: true } });

  const project = await prisma.project.create({
    data: {
      name: name.slice(0, 40),
      desc: body.desc ? String(body.desc).slice(0, 200) : null,
      color: body.color || "indigo",
      order: (max._max.order ?? -1) + 1,
    },
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(project, { status: 201 });
}

// PUT /api/projects —— 重排项目顺序(按传入 id 的顺序写回 order)
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.map((x: unknown) => String(x))
    : [];
  if (!ids.length) return NextResponse.json({ error: "缺少项目顺序" }, { status: 400 });

  await prisma.$transaction(
    ids.map((id, i) => prisma.project.update({ where: { id }, data: { order: i } }))
  );
  return NextResponse.json({ ok: true });
}
