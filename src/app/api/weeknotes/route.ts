import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/weeknotes —— 全部周记(按年+周号倒序)
export async function GET() {
  const notes = await prisma.weekNote.findMany({
    orderBy: [{ isoYear: "desc" }, { isoWeek: "desc" }],
  });
  return NextResponse.json(notes);
}
