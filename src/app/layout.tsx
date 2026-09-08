import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "work-navi · 项目资源导航台",
  description: "集中管理多项目的资源地址、凭证与每周任务。",
};

// 在首帧渲染前设定 data-theme,避免暗/亮切换时的闪烁(FOUC)。
const themeInitScript = `(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t !== "light" && t !== "dark") {
      t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${firaSans.variable} ${firaCode.variable}`} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
