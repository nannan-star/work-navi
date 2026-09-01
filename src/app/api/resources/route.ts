import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/resources —— 新建资源
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const projectId = String(body.projectId ?? "");
  const categoryId = String(body.categoryId ?? "");

  if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  if (!projectId) return NextResponse.json({ error: "缺少项目" }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "缺少分类" }, { status: 400 });

  const max = await prisma.resource.aggregate({
    where: { projectId },
    _max: { order: true },
  });

  const resource = await prisma.resource.create({
    data: {
      projectId,
      categoryId,
      title: title.slice(0, 60),
      url: body.url ? String(body.url).trim() : null,
      note: body.note ? String(body.note).slice(0, 200) : null,
      username: body.username ? String(body.username) : null,
      password: body.password ? String(body.password) : null,
      order: (max._max.order ?? -1) + 1,
    },
    include: { category: true },
  });
  return NextResponse.json(resource, { status: 201 });
}
