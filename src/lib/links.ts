// 链接输入清洗:过滤空行,空名称回退「地址」,按顺序赋 order。
export interface LinkInput {
  label?: unknown;
  url?: unknown;
}

export function sanitizeLinks(input: unknown): { label: string; url: string; order: number }[] {
  if (!Array.isArray(input)) return [];
  const out: { label: string; url: string; order: number }[] = [];
  let order = 0;
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    const url = typeof obj.url === "string" ? obj.url.trim() : "";
    if (!url) continue;
    const label = typeof obj.label === "string" && obj.label.trim() ? obj.label.trim() : "地址";
    out.push({ label: label.slice(0, 40), url, order: order++ });
  }
  return out;
}
