import { prisma } from "@/lib/db";
import { getWeekInfo } from "@/lib/week";
import Home from "@/components/Home";

// 个人本机应用,禁用静态缓存,始终读取最新数据。
export const dynamic = "force-dynamic";

export default async function Page() {
  const [projects, categories, weekNotes, currentWeek] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        resources: {
          orderBy: { order: "asc" },
          include: { category: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.weekNote.findMany({
      orderBy: [{ isoYear: "desc" }, { isoWeek: "desc" }],
    }),
    Promise.resolve(getWeekInfo()),
  ]);

  // Date → 字符串,确保传给客户端组件的是纯对象。
  return (
    <Home
      initialData={{
        projects: JSON.parse(JSON.stringify(projects)),
        categories: JSON.parse(JSON.stringify(categories)),
        weekNotes: JSON.parse(JSON.stringify(weekNotes)),
        currentWeek: {
          isoYear: currentWeek.isoYear,
          isoWeek: currentWeek.isoWeek,
          key: currentWeek.key,
          label: currentWeek.label,
          range: currentWeek.range,
        },
      }}
    />
  );
}
