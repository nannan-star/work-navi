import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeLinks } from "@/lib/links";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/resources/[id] —— 编辑资源
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const hasTitle = typeof body.title === "string";
  const title = hasTitle ? body.title.trim() : "";
  if (hasTitle && !title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      title: hasTitle ? title.slice(0, 60) : undefined,
      categoryId: body.categoryId || undefined,
      note: body.note !== undefined ? (body.note ? String(body.note).slice(0, 200) : null) : undefined,
      username: body.username !== undefined ? (body.username ? String(body.username) : null) : undefined,
      password: body.password !== undefined ? (body.password ? String(body.password) : null) : undefined,
      links:
        body.links !== undefined
          ? { deleteMany: {}, create: sanitizeLinks(body.links) }
          : undefined,
    },
    include: { category: true, links: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(resource);
}

// DELETE /api/resources/[id] —— 删除资源
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
