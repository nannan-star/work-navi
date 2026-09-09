import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/projects/[id] —— 项目详情(含按分类的资源)
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      resources: {
        orderBy: { order: "asc" },
        include: { category: true, links: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json(project);
}

// PATCH /api/projects/[id] —— 编辑项目
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: name.slice(0, 40),
      desc: body.desc !== undefined ? String(body.desc).slice(0, 200) : undefined,
      color: body.color || undefined,
    },
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(project);
}

// DELETE /api/projects/[id] —— 删除项目(级联删除其资源)
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
