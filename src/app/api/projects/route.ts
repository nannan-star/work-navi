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

  const project = await prisma.project.create({
    data: {
      name: name.slice(0, 40),
      desc: body.desc ? String(body.desc).slice(0, 200) : null,
      color: body.color || "indigo",
    },
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(project, { status: 201 });
}
