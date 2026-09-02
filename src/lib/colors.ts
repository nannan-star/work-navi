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

export const CATEGORY_COLORS: ColorOption[] = [
  { key: "req", label: "紫色", css: "var(--c-req)" },
  { key: "env", label: "青色", css: "var(--c-env)" },
  { key: "task", label: "橙黄", css: "var(--c-task)" },
  { key: "proto", label: "粉色", css: "var(--c-proto)" },
  { key: "git", label: "绿色", css: "var(--c-git)" },
  { key: "other", label: "灰色", css: "var(--c-other)" },
];

export function categoryColorCss(key: string): string {
  return CATEGORY_COLORS.find((c) => c.key === key)?.css ?? "var(--c-other)";
}
