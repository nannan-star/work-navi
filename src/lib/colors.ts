// 颜色 key → CSS 变量映射(项目圆点 / 分类色条共用)。

export interface ColorOption {
  key: string;
  label: string;
  css: string;
}

export const PROJECT_COLORS: ColorOption[] = [
  { key: "indigo", label: "靛蓝", css: "var(--primary)" },
  { key: "green", label: "绿色", css: "var(--accent)" },
  { key: "sky", label: "天蓝", css: "var(--info)" },
  { key: "orange", label: "橙色", css: "var(--warn)" },
  { key: "pink", label: "粉色", css: "var(--c-proto)" },
  { key: "purple", label: "紫色", css: "var(--c-req)" },
];

export function projectColorCss(key: string): string {
  return PROJECT_COLORS.find((c) => c.key === key)?.css ?? "var(--primary)";
}

const CATEGORY_COLORS: Record<string, string> = {
  req: "var(--c-req)",
  env: "var(--c-env)",
  task: "var(--c-task)",
  proto: "var(--c-proto)",
  git: "var(--c-git)",
  other: "var(--c-other)",
};

export function categoryColorCss(key: string): string {
  return CATEGORY_COLORS[key] ?? "var(--c-other)";
}
