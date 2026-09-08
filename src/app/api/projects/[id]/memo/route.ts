import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/projects/[id]/memo —— 保存项目开发笔记(Markdown)
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const memo = String(body.memo ?? "");

  const project = await prisma.project.update({
    where: { id },
    data: { memo },
  });
  return NextResponse.json(project);
}
