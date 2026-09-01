import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/categories/[id] —— 重命名 / 改色
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (body.color) data.color = body.color;

  const category = await prisma.category.update({
    where: { id },
    data,
    include: { _count: { select: { resources: true } } },
  });
  return NextResponse.json(category);
}

// DELETE /api/categories/[id] —— 删除分类(有资源则拒绝)
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const count = await prisma.resource.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `该分类下还有 ${count} 条资源,无法删除` },
      { status: 409 }
    );
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
