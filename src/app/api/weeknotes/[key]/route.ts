import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mondayOfIsoWeek } from "@/lib/week";

type Ctx = { params: Promise<{ key: string }> };

// 解析 "2026-36" → { isoYear, isoWeek }
function parseKey(key: string): { isoYear: number; isoWeek: number } | null {
  const m = /^(\d{4})-(\d{1,2})$/.exec(key);
  if (!m) return null;
  const isoYear = Number(m[1]);
  const isoWeek = Number(m[2]);
  if (isoWeek < 1 || isoWeek > 53) return null;
  return { isoYear, isoWeek };
}

// GET /api/weeknotes/[key] —— 读取某周
export async function GET(_req: Request, { params }: Ctx) {
  const { key } = await params;
  const parsed = parseKey(key);
  if (!parsed) return NextResponse.json({ error: "无效的周标识" }, { status: 400 });

  const note = await prisma.weekNote.findUnique({
    where: { isoYear_isoWeek: parsed },
  });
  if (!note) return NextResponse.json({ error: "该周暂无记录" }, { status: 404 });
  return NextResponse.json(note);
}

// PUT /api/weeknotes/[key] —— 写入某周(upsert)
export async function PUT(req: Request, { params }: Ctx) {
  const { key } = await params;
  const parsed = parseKey(key);
  if (!parsed) return NextResponse.json({ error: "无效的周标识" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "");

  const monday = mondayOfIsoWeek(parsed.isoYear, parsed.isoWeek);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const note = await prisma.weekNote.upsert({
    where: { isoYear_isoWeek: parsed },
    update: { content },
    create: {
      isoYear: parsed.isoYear,
      isoWeek: parsed.isoWeek,
      startDate: monday,
      endDate: sunday,
      content,
    },
  });
  return NextResponse.json(note);
}
