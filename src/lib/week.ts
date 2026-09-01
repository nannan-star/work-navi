// ISO 周(自然周,周一为一周首日)计算工具。
// 同时被服务端(seed / API)与客户端(周记显示)复用。

export interface WeekInfo {
  isoYear: number;
  isoWeek: number;
  startDate: Date; // 该周周一 00:00 (UTC)
  endDate: Date; // 该周周日 00:00 (UTC)
  key: string; // "2026-36"
  label: string; // "W36"
  range: string; // "8月31日 – 9月6日"
}

/** 计算某个日期所属的 ISO 年 + 周号(周一开始,周内含首个周四)。 */
export function isoWeekOf(date: Date): { isoYear: number; isoWeek: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // 移到本周周四
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { isoYear: d.getUTCFullYear(), isoWeek: weekNo };
}

/** 由 ISO 年 + 周号反推该周周一(1 月 4 日必在第 1 周)。 */
export function mondayOfIsoWeek(isoYear: number, isoWeek: number): Date {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayNum = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (dayNum - 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (isoWeek - 1) * 7);
  return monday;
}

function fmtMD(d: Date): string {
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

/** "8月31日 – 9月6日" 形式的周范围。 */
export function formatWeekRange(isoYear: number, isoWeek: number): string {
  const monday = mondayOfIsoWeek(isoYear, isoWeek);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return `${fmtMD(monday)} – ${fmtMD(sunday)}`;
}

/** "2026 年第 36 周" 形式的标题。 */
export function formatWeekTitle(isoYear: number, isoWeek: number): string {
  return `${isoYear} 年第 ${isoWeek} 周`;
}

/** 当前周信息(按系统日期)。 */
export function getWeekInfo(date: Date = new Date()): WeekInfo {
  const { isoYear, isoWeek } = isoWeekOf(date);
  const monday = mondayOfIsoWeek(isoYear, isoWeek);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    isoYear,
    isoWeek,
    startDate: monday,
    endDate: sunday,
    key: `${isoYear}-${isoWeek}`,
    label: `W${isoWeek}`,
    range: `${fmtMD(monday)} – ${fmtMD(sunday)}`,
  };
}

/** 周记内容的首行摘要(用于历史列表)。 */
export function excerpt(content: string, max = 60): string {
  const flat = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+\[[ x]\]\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? flat.slice(0, max) + "…" : flat;
}
