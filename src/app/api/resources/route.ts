import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeLinks } from "@/lib/links";

// POST /api/resources —— 新建资源
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const projectId = String(body.projectId ?? "");
  const categoryId = String(body.categoryId ?? "");

  if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  if (!projectId) return NextResponse.json({ error: "缺少项目" }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "缺少分类" }, { status: 400 });

  const category = await prisma.category.findFirst({ where: { id: categoryId, projectId } });
  if (!category) return NextResponse.json({ error: "分类不属于该项目" }, { status: 400 });

  const max = await prisma.resource.aggregate({
    where: { projectId },
    _max: { order: true },
  });

  const resource = await prisma.resource.create({
    data: {
      projectId,
      categoryId,
      title: title.slice(0, 60),
      note: body.note ? String(body.note).slice(0, 200) : null,
      username: body.username ? String(body.username) : null,
      password: body.password ? String(body.password) : null,
      order: (max._max.order ?? -1) + 1,
      links: { create: sanitizeLinks(body.links) },
    },
    include: { category: true, links: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(resource, { status: 201 });
}

// PUT /api/resources —— 重排资源顺序(按传入 id 的顺序写回 order)
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.map((x: unknown) => String(x))
    : [];
  if (!ids.length) return NextResponse.json({ error: "缺少资源顺序" }, { status: 400 });

  await prisma.$transaction(
    ids.map((id, i) => prisma.resource.update({ where: { id }, data: { order: i } }))
  );
  return NextResponse.json({ ok: true });
}
